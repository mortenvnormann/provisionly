import { AuthForm } from "@/components/auth/auth-form";
import { GuestLink } from "@/components/auth/guest-link";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="safe-area-pt flex min-h-full flex-1 flex-col items-center justify-center px-6 py-12">
      <AuthForm nextPath={next} />
      <GuestLink />
    </main>
  );
}
