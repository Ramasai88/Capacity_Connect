import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { isDemoMode } from "@/lib/demo/config";
import { DEMO_ORGANIZATION } from "@/lib/demo/data";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  const demoActive = isDemoMode();
  let orgName = DEMO_ORGANIZATION.name === "KL University" ? "Capacity Connect" : DEMO_ORGANIZATION.name;

  if (!demoActive && session.user.organizationId) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { name: true },
      });
      if (organization?.name) {
        orgName = organization.name === "KL University" ? "Capacity Connect" : organization.name;
      }
    } catch {
      // Fall back gracefully if database connectivity is unavailable
      orgName = DEMO_ORGANIZATION.name === "KL University" ? "Capacity Connect" : DEMO_ORGANIZATION.name;
    }
  }

  const role = (session.user.role as "ADMIN" | "MANAGER" | "EMPLOYEE") || "ADMIN";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col">
        <TopNav
          userName={session.user.name ?? session.user.email ?? "User"}
          role={role}
          organizationName={orgName}
          isDemo={demoActive}
        />
        <main className="flex-1 bg-muted/20 p-6">{children}</main>
        <AssistantWidget />
      </div>
    </div>
  );
}
