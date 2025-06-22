"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is finished
    if (loading) {
      return;
    }

    // If there is no user, send to login page
    if (!user) {
      router.push("/auth");
      return;
    }

    // Redirect based on role
    if (user.role === "TEACHER") {
      router.push("/dashboard/teacher");
    } else if (user.role === "STUDENT") {
      router.push("/dashboard/student");
    } else {
      // Fallback for users with no role or other roles
      // For now, we can send them to the home page.
      router.push("/");
    }
  }, [user, loading, router]);

  // Show a loading state while we redirect the user
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Preparing your dashboard...</p>
      </div>
    </div>
  );
}
