import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-slate-400">
        Manage your account and integrations.
      </p>
      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="font-medium text-white">User Profile</h3>
          <div className="mt-3 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p>
              Name: <span className="text-white">{session?.user.name ?? "Not set"}</span>
            </p>
            <p>
              Email: <span className="text-white">{session?.user.email ?? "Not set"}</span>
            </p>
            <p>
              Role: <span className="text-white">{session?.user.role ?? "member"}</span>
            </p>
            <p>
              Merchant: <span className="text-white">{session?.user.merchantId ?? "—"}</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="font-medium text-white">Shopify Integration</h3>
          <p className="mt-1 text-sm text-slate-400">
            Connect your Shopify store to sync orders and products.
          </p>
          <button className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
            Connect Shopify
          </button>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="font-medium text-white">Notifications</h3>
          <p className="mt-1 text-sm text-slate-400">
            Resend (email) and Twilio (SMS) for customer updates.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Configure `MCP_RESEND_ENDPOINT` and `MCP_TWILIO_ENDPOINT` in env to enable
            connector-based delivery.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="font-medium text-white">Theme Management</h3>
          <p className="mt-1 text-sm text-slate-400">
            Use the top bar theme switcher to toggle between midnight and ocean themes.
          </p>
        </div>
      </div>
    </div>
  );
}
