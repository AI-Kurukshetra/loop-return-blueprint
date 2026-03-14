import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/roles";
import { connectShopifyViaMcp } from "@/lib/mcp-connectors";

const schema = z.object({
  shopifyDomain: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+\.myshopify\.com$/, "Invalid Shopify domain"),
  shopifyAccessToken: z.string().trim().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(session.user.role);
    if (role !== "seller" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = schema.parse(body);

    const connection = await connectShopifyViaMcp({
      shopifyDomain: data.shopifyDomain,
      shopifyAccessToken: data.shopifyAccessToken,
    });

    if (!connection.ok) {
      return NextResponse.json(
        { error: connection.error ?? "Unable to connect Shopify via MCP." },
        { status: 502 }
      );
    }

    const merchant = await prisma.merchant.update({
      where: { id: session.user.merchantId },
      data: {
        shopifyDomain: data.shopifyDomain,
        shopifyAccessToken: data.shopifyAccessToken,
      },
      select: {
        id: true,
        name: true,
        shopifyDomain: true,
      },
    });

    return NextResponse.json({
      ...merchant,
      connectionProvider: connection.provider,
      connectionRef: connection.providerRef,
    });
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
