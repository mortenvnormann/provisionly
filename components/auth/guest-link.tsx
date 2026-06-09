import { continueAsGuest } from "@/lib/auth/actions";

export function GuestLink() {
  return (
    <form action={continueAsGuest} className="mt-8 text-center">
      <button
        type="submit"
        className="text-sm text-[var(--brand)] underline-offset-4 hover:underline"
      >
        Continue as guest
      </button>
    </form>
  );
}
