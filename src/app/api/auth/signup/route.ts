import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  merchantName: z.string().min(1).optional(),
  merchantEmail: z.string().email().optional(),
  role: z.enum(["seller", "client"]).default("seller"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, merchantName, merchantEmail, role } = schema.parse(body);

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    let merchant;
    if (role === "seller") {
      if (!merchantName) {
        return NextResponse.json(
          { error: "merchantName is required for seller signup" },
          { status: 400 }
        );
      }
      merchant = await prisma.merchant.create({
        data: { name: merchantName, email },
      });
    } else {
      if (!merchantEmail) {
        return NextResponse.json(
          { error: "merchantEmail is required for client signup" },
          { status: 400 }
        );
      }
      merchant = await prisma.merchant.findUnique({
        where: { email: merchantEmail },
      });
      if (!merchant) {
        return NextResponse.json(
          { error: "Merchant not found. Please ask seller for correct merchant email." },
          { status: 404 }
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        merchantId: merchant.id,
        passwordHash: await hashPassword(password),
        role: role === "seller" ? "seller" : "client",
      },
      include: { merchant: true },
    });

    if (role === "client") {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          merchantId: merchant.id,
          email,
        },
      });
      if (!existingCustomer) {
        await prisma.customer.create({
          data: {
            merchantId: merchant.id,
            email,
            name,
          },
        });
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        merchantId: user.merchantId,
        merchantName: user.merchant.name,
      },
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
