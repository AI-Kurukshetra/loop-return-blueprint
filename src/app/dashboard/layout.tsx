import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import DashboardTopbarControls from "@/components/dashboard-topbar-controls";
import { normalizeRole } from "@/lib/roles";

const adminNav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/returns", label: "Returns" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/inventory", label: "Inventory Management" },
  { href: "/dashboard/communications", label: "Communications" },
  { href: "/dashboard/policies", label: "Return Policies" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/admin", label: "Admin Ops" },
];

const sellerNav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/returns", label: "Returns" },
  { href: "/dashboard/inventory", label: "Inventory Management" },
  { href: "/dashboard/policies", label: "Return Policies" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const role = normalizeRole(session.user.role);
  if (role === "client") {
    redirect("/client");
  }
  const nav = role === "admin" ? adminNav : sellerNav;

  return (
    <div className="dashboard-shell min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(249,115,22,0.2),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(6,182,212,0.22),transparent_35%),#020617]">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            Loop Return
          </Link>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="pl-64">
        <div className="border-b border-slate-800/80 px-8 py-3 text-sm text-slate-400">
          <div className="flex items-center justify-between gap-4">
            <div>
              Signed in as <span className="font-medium text-white">{session.user.email}</span>
            </div>
            <DashboardTopbarControls
              merchantId={session.user.merchantId}
              email={session.user.email ?? ""}
              name={session.user.name}
            />
          </div>
        </div>
        <div className="min-h-screen p-8">{children}</div>
      </main>
    </div>
  );
}
