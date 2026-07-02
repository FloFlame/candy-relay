import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell user={{ name: user.name, email: user.email, plan: user.plan }}>
      {children}
    </AppShell>
  );
}
