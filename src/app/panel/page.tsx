import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { normalizeRole } from "@/lib/roles";

export default async function PanelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const role = normalizeRole(session.user.role);
  if (role === "client") {
    redirect("/client");
  }
  redirect("/dashboard");
}
