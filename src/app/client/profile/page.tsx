import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/roles";
import Link from "next/link";

export default async function ClientProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/client/profile");
  if (normalizeRole(session.user.role) !== "client") redirect("/dashboard");

  const customer = await prisma.customer.findFirst({
    where: {
      merchantId: session.user.merchantId,
      email: session.user.email ?? undefined,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/client" className="text-sm text-slate-400 hover:text-white">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">Profile</h1>
      <p className="mt-1 text-sm text-slate-400">Your account details.</p>

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Name</dt>
            <dd className="mt-1 text-white">{customer?.name ?? session.user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</dt>
            <dd className="mt-1 text-white">{session.user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Phone</dt>
            <dd className="mt-1 text-white">{customer?.phone ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-slate-500">
          To update your details, contact the store.
        </p>
      </div>
    </div>
  );
}
