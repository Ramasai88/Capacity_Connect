import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface AccessDeniedProps {
  requiredRole?: string;
  currentRole?: string;
  resourceName?: string;
}

export function AccessDenied({
  requiredRole = "ADMIN",
  currentRole = "EMPLOYEE",
  resourceName = "this administrative area",
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-amber-300/60 bg-amber-500/5 dark:border-amber-900/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300 mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">Access Restricted</CardTitle>
          <CardDescription className="text-xs">
            Role-Based Authorization Required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-xs">
          <p className="text-muted-foreground leading-relaxed">
            You are currently signed in as <strong className="text-foreground">{currentRole}</strong>. Access to {resourceName} requires <strong className="text-foreground">{requiredRole}</strong> role permissions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto text-xs gap-1.5">
                <Home className="h-3.5 w-3.5" />
                Return to Dashboard
              </Button>
            </Link>
            <Link href="/courses" className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Browse Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
