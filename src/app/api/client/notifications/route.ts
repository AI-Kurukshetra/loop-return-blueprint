import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/roles";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (normalizeRole(session.user.role) !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        merchantId: session.user.merchantId,
        email: session.user.email ?? undefined,
      },
    });

    if (!customer) {
      return NextResponse.json({
        summary: { total: 0, sent: 0 },
        recent: [],
      });
    }

    const [total, sent, recent] = await Promise.all([
      prisma.communicationEvent.count({
        where: { customerId: customer.id },
      }),
      prisma.communicationEvent.count({
        where: { customerId: customer.id, status: "sent" },
      }),
      prisma.communicationEvent.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          eventType: true,
          channel: true,
          status: true,
          recipient: true,
          createdAt: true,
          return: {
            select: { rmaNumber: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      summary: { total, sent },
      recent,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
