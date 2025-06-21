"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
            Welcome, {user.displayName || user.email}!
          </h1>
          {user.role && <Badge variant="secondary">{user.role}</Badge>}
        </div>
        <p className="text-muted-foreground">This is your personal dashboard. Manage your learning and teaching here.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Dashboard</CardTitle>
            <CardDescription>
              Access your courses, track your progress, and continue learning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your enrolled courses will appear here soon!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Teacher Portal</CardTitle>
            <CardDescription>
              Create and manage your courses and educational materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/teacher">Go to Teacher Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
