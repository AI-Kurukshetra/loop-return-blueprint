import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import ClientTopbarControls from "@/components/client-topbar-controls";
import { normalizeRole } from "@/lib/roles";

const clientNav = [
  { href: "/client", label: "My Returns" },
  { href: "/client/new", label: "New Return" },
  { href: "/client/profile", label: "Profile" },
];

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/client");
  }

  const role = normalizeRole(session.user.role);
  if (role !== "client") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(56,189,248,0.1),transparent_35%)]"
        aria-hidden
      />
      <aside className="fixed inset-y-0 left-0 w-56 border-r border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="flex h-16 items-center border-b border-slate-800 px-5">
          <Link href="/client" className="text-lg font-bold text-white">
            Loop Return
          </Link>
        </div>
        <nav className="space-y-0.5 px-3 py-4">
          {clientNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800/80 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="pl-56">
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 px-6 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              Customer Portal · <span className="font-medium text-white">{session.user.email}</span>
            </p>
            <ClientTopbarControls
              email={session.user.email ?? ""}
              name={session.user.name}
            />
          </div>
        </header>
        <div className="min-h-[calc(100vh-4rem)] p-6">{children}</div>
      </main>
    </div>
  );
}
