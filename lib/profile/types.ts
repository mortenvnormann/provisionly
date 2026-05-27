export type UserProfile = {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string;
};

export function profileGreeting(
  profile: Pick<UserProfile, "firstName" | "lastName" | "displayName">,
  email?: string | null,
): string {
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || profile.displayName || email?.split("@")[0] || "there";
}
