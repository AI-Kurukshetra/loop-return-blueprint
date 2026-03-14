import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canAccessMerchant, getSellerOrAdminContext } from "@/lib/access-control";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessMerchant(id, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include:
        context.role === "admin"
          ? {
              users: true,
              customers: true,
              orders: true,
              returns: true,
            }
          : {
              customers: true,
              orders: true,
              returns: true,
            },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
