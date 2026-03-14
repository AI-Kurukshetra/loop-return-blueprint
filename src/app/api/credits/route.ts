import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  customerId: z.string(),
  amount: z.number().positive(),
  expiryDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json(
      { error: "customerId is required" },
      { status: 400 }
    );
  }

  try {
    const credits = await prisma.storeCredit.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    const totalBalance = credits.reduce(
      (sum, c) => sum + Number(c.balance),
      0
    );

    return NextResponse.json({ credits, totalBalance });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const credit = await prisma.storeCredit.create({
      data: {
        customerId: data.customerId,
        amount: data.amount,
        balance: data.amount,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });

    return NextResponse.json(credit);
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
