import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/auth/session";

export default async function RecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isGuest } = await getSessionState();

  if (!user) {
    redirect(isGuest ? "/home" : "/login");
  }

  return children;
}
