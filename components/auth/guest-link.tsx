import { continueAsGuest } from "@/lib/auth/actions";
import { useTranslations } from "next-intl";

export function GuestLink() {
  const t = useTranslations("auth");

  return (
    <form action={continueAsGuest} className="mt-8 text-center">
      <button
        type="submit"
        className="text-sm text-[var(--brand)] underline-offset-4 hover:underline"
      >
        {t("continueAsGuest")}
      </button>
    </form>
  );
}
