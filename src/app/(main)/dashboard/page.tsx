"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
          Welcome, {user.displayName || user.email}!
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Your Dashboard</CardTitle>
            <CardDescription>
              This is your personal dashboard. You can manage your courses and profile here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>More features for teachers and students will be added here soon!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
