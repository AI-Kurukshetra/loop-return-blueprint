import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canAccessMerchant, getSellerOrAdminContext } from "@/lib/access-control";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(400).optional(),
  returnWindowDays: z.number().int().min(1).max(365).optional(),
  allowedConditions: z
    .array(z.enum(["unopened", "opened", "damaged", "defective"]))
    .optional(),
  excludedCategories: z.array(z.string().trim().min(1).max(64)).optional(),
  requireOriginalPackaging: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.returnPolicy.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    if (!canAccessMerchant(existing.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conditionsObject =
      data.allowedConditions !== undefined ||
      data.excludedCategories !== undefined ||
      data.requireOriginalPackaging !== undefined
        ? {
            ...(typeof existing.conditions === "object" && existing.conditions
              ? (existing.conditions as Record<string, unknown>)
              : {}),
            ...(data.allowedConditions !== undefined
              ? { allowedConditions: data.allowedConditions }
              : {}),
            ...(data.excludedCategories !== undefined
              ? { excludedCategories: data.excludedCategories }
              : {}),
            ...(data.requireOriginalPackaging !== undefined
              ? { requireOriginalPackaging: data.requireOriginalPackaging }
              : {}),
          }
        : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.returnPolicy.updateMany({
          where: {
            merchantId: existing.merchantId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return tx.returnPolicy.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.returnWindowDays !== undefined
            ? { returnWindowDays: data.returnWindowDays }
            : {}),
          ...(conditionsObject !== undefined ? { conditions: conditionsObject } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.returnPolicy.findUnique({
      where: { id },
      select: { merchantId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    if (!canAccessMerchant(existing.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.returnPolicy.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete policy" },
      { status: 400 }
    );
  }
}
