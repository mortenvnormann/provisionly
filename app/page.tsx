import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";

export default async function RootPage() {
  const { isAuthenticated, isGuest } = await getSessionState();
  redirect(isAuthenticated || isGuest ? "/home" : "/login");
}
