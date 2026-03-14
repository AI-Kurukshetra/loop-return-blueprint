import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/roles";

const schema = z.object({
  action: z.enum(["approve", "reject", "fraud_hold"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (normalizeRole(session.user.role) !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = schema.parse(body);

    const target = await prisma.return.findFirst({
      where: { id },
    });

    if (!target) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (action === "fraud_hold") {
      const updated = await prisma.return.update({
        where: { id },
        data: { status: "rejected", notes: "Flagged by admin fraud review." },
      });
      await prisma.fraudEvent.create({
        data: {
          merchantId: target.merchantId,
          customerId: target.customerId,
          returnId: target.id,
          eventType: "admin_fraud_hold",
          details: { actionBy: session.user.email },
        },
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.return.update({
      where: { id },
      data: {
        status: action === "approve" ? "approved" : "rejected",
        ...(action === "approve" ? { approvedAt: new Date() } : {}),
      },
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
