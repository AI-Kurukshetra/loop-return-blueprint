import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { normalizeRole, type AppRole } from "@/lib/roles";

export type AccessContext = {
  role: AppRole;
  merchantId: string;
};

export async function getSellerOrAdminContext(): Promise<AccessContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }

  const role = normalizeRole(session.user.role);
  if (role !== "seller" && role !== "admin") {
    return null;
  }

  return {
    role,
    merchantId: session.user.merchantId,
  };
}

export function scopedMerchantId(
  request: NextRequest,
  context: AccessContext,
  paramName = "merchantId"
): string | null {
  const requested = new URL(request.url).searchParams.get(paramName);
  if (context.role === "admin") {
    return requested;
  }
  return context.merchantId;
}

export function canAccessMerchant(
  merchantId: string,
  context: AccessContext
): boolean {
  return context.role === "admin" || merchantId === context.merchantId;
}
