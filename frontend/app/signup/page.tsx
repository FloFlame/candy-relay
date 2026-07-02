import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Start free" };
export const dynamic = "force-dynamic";

export default function SignupPage() {
  if (getCurrentUser()) redirect("/app");
  return <AuthForm mode="signup" />;
}
