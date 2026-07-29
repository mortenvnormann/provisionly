import { redirect } from "next/navigation";
import { TabShell } from "@/components/layout/tab-shell";
import { getSessionState } from "@/lib/auth/session";

export default async function RecipesTabPage() {
  const { isGuest } = await getSessionState();
  if (isGuest) redirect("/home");
  return <TabShell />;
}
