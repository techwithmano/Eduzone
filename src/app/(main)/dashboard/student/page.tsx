
"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function StudentDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to finish loading
    if (!user) {
      router.push("/auth"); // Redirect if not logged in
      return;
    }
    if (user.role !== "STUDENT") {
      router.push("/dashboard"); // Redirect if not a student
      return;
    }
  }, [user, loading, router]);

  if (loading) {
     return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'STUDENT') {
    // This is a fallback while redirecting
    return null;
  }

  return (
    <div className="container py-8">
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
             Welcome, {user.displayName || user.email}!
          </h1>
          {user.role && <Badge>{user.role}</Badge>}
        </div>
        <p className="text-muted-foreground">This is your student dashboard. Your courses and assignments will appear here.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>
              All the courses you are enrolled in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You are not enrolled in any courses yet.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>
              Keep track of what's due next.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>No upcoming assignments.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
