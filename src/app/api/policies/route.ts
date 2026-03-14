import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  canAccessMerchant,
  getSellerOrAdminContext,
  scopedMerchantId,
} from "@/lib/access-control";

const policySchema = z.object({
  merchantId: z.string(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional(),
  returnWindowDays: z.number().int().min(1).max(365),
  allowedConditions: z
    .array(z.enum(["unopened", "opened", "damaged", "defective"]))
    .default(["unopened", "opened"]),
  excludedCategories: z.array(z.string().trim().min(1).max(64)).default([]),
  requireOriginalPackaging: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchantId = scopedMerchantId(request, context);

    if (!merchantId) {
      return NextResponse.json(
        { error: "merchantId is required" },
        { status: 400 }
      );
    }

    const policies = await prisma.returnPolicy.findMany({
      where: { merchantId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(policies);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = policySchema.parse(body);

    if (!canAccessMerchant(data.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conditions = {
      allowedConditions: data.allowedConditions,
      excludedCategories: data.excludedCategories,
      requireOriginalPackaging: data.requireOriginalPackaging,
    };

    const created = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.returnPolicy.updateMany({
          where: { merchantId: data.merchantId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.returnPolicy.create({
        data: {
          merchantId: data.merchantId,
          name: data.name,
          description: data.description,
          returnWindowDays: data.returnWindowDays,
          conditions,
          isDefault: data.isDefault,
        },
      });
    });

    return NextResponse.json(created);
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
