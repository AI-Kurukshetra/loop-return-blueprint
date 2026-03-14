import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreReturnFraud } from "@/lib/fraud";

const schema = z.object({
  returnId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnId } = schema.parse(body);
    const score = await scoreReturnFraud({ returnId });
    return NextResponse.json(score);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
