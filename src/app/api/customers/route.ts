import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSellerOrAdminContext, scopedMerchantId } from "@/lib/access-control";

export async function GET(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = scopedMerchantId(request, context);
    const email = searchParams.get("email");

    const customers = await prisma.customer.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        ...(email ? { email: { contains: email, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(customers);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
