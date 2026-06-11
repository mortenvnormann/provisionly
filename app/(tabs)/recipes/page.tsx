import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";

export default async function RecipesTabPage() {
  const { isGuest } = await getSessionState();
  if (isGuest) redirect("/home");
  return null;
}
