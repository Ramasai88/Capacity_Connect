import { getCurrentSession } from "@/lib/auth/session";
import { LandingPage } from "@/components/landing/landing-page";

export default async function RootPage() {
  const session = await getCurrentSession();

  return (
    <LandingPage
      isAuthenticated={Boolean(session?.user)}
      userName={session?.user?.name}
    />
  );
}
