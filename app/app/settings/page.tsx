import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/app/SettingsForm";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const user = getCurrentUser()!;
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your profile, plan and API access.</p>
      <div className="mt-6">
        <SettingsForm
          initial={{ name: user.name, email: user.email, plan: user.plan, apiToken: user.apiToken }}
        />
      </div>
    </div>
  );
}
