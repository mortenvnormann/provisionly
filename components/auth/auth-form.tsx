"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { hasPendingGuestLists } from "@/lib/guest/migrate";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "signin" | "signup";

type AuthFormProps = {
  nextPath?: string;
};

export function AuthForm({ nextPath }: AuthFormProps) {
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
          // Import on /home via server action (reliable auth cookies)
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
          setInfo(
            "Account created. Check your email to confirm, then sign in here.",
          );
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
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium tracking-wide text-[var(--brand)] uppercase">
          Provisionly
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Collaborative grocery lists, made simple.
        </p>
      </div>

      <div className="mb-6 flex rounded-xl bg-[var(--muted)] p-1">
        <button
          type="button"
          className={[
            "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
            mode === "signin"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]",
          ].join(" ")}
          onClick={() => {
            setMode("signin");
            setError(null);
            setInfo(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={[
            "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
            mode === "signup"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]",
          ].join(" ")}
          onClick={() => {
            setMode("signup");
            setError(null);
            setInfo(null);
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {info ? (
          <p className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--foreground)]">
            {info}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>
    </div>
  );
}
