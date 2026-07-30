"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { hasPendingGuestLists } from "@/lib/guest/migrate";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { mapAuthErrorKey } from "@/lib/auth/map-auth-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

type Mode = "signin" | "signup";

type AuthFormProps = {
  nextPath?: string;
};

export function AuthForm({ nextPath }: AuthFormProps) {
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const destination = safeNextPath(nextPath);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && hasPendingGuestLists() && !destination.startsWith("/join/")) {
          router.push("/home?import=guest");
          router.refresh();
          return;
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setInfo(tAuth("accountCreated"));
          setMode("signin");
          return;
        }

        if (data.user) {
          if (hasPendingGuestLists() && !destination.startsWith("/join/")) {
            router.push("/home?import=guest");
            router.refresh();
            return;
          }
        }
      }

      router.push(destination);
      router.refresh();
    } catch (err) {
      console.error(err);
      const key = mapAuthErrorKey(err);
      setError(key ? tAuth(key) : tCommon("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <p className="font-ui text-[11px] font-medium tracking-[0.12em] text-[var(--brand)] uppercase">
          {tCommon("appName")}
        </p>
        <h1 className="heading-editorial mt-2 text-2xl text-[var(--foreground)]">
          {mode === "signin" ? tAuth("welcomeBack") : tAuth("createAccount")}
        </h1>
        <p className="font-ui mt-2 text-sm text-[var(--muted-foreground)]">
          {tAuth("tagline")}
        </p>
      </div>

      <div className="mb-5 flex rounded-full bg-[var(--muted)] p-0.5">
        <button
          type="button"
          className={[
            "font-ui flex-1 rounded-full py-2 text-sm font-medium transition-colors",
            mode === "signin"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-token-sm"
              : "text-[var(--muted-foreground)]",
          ].join(" ")}
          onClick={() => {
            setMode("signin");
            setError(null);
            setInfo(null);
          }}
        >
          {tAuth("signIn")}
        </button>
        <button
          type="button"
          className={[
            "font-ui flex-1 rounded-full py-2 text-sm font-medium transition-colors",
            mode === "signup"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-token-sm"
              : "text-[var(--muted-foreground)]",
          ].join(" ")}
          onClick={() => {
            setMode("signup");
            setError(null);
            setInfo(null);
          }}
        >
          {tAuth("createAccountButton")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label={tAuth("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={tAuth("password")}
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {info ? (
          <p className="card-surface-bordered font-ui px-3 py-2 text-sm text-[var(--foreground)]">
            {info}
          </p>
        ) : null}

        {error ? (
          <p className="font-ui rounded-[var(--radius-card)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-3 py-2 text-sm text-[var(--destructive)]">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={loading}>
          {loading
            ? tCommon("pleaseWait")
            : mode === "signin"
              ? tAuth("signIn")
              : tAuth("createAccountButton")}
        </Button>
      </form>
    </div>
  );
}
