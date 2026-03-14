import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { normalizeRole } from "@/lib/roles";
import SellerShopifyConnect from "@/components/seller-shopify-connect";

export default async function SellerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/seller");
  }
  const role = normalizeRole(session.user.role);
  if (role !== "seller" && role !== "admin") {
    redirect("/panel");
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Seller Panel</h1>
      <p className="mt-2 text-slate-300">
        Connect Shopify, manage return operations, and issue credits post-return.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/returns" className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
          Return Requests
        </Link>
        <Link href="/dashboard/inventory" className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
          Inventory and Products
        </Link>
        <Link href="/dashboard/analytics" className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
          Credits and Analytics
        </Link>
      </div>

      <SellerShopifyConnect />
    </div>
  );
}
