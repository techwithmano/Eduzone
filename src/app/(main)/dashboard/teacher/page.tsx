
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { type Classroom } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (user.role !== "TEACHER") {
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    // This query is now fixed: removed the invalid `orderBy` clause.
    const classroomQuery = query(
        collection(db, "classrooms"), 
        where("teacherIds", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(classroomQuery, (querySnapshot) => {
        const assignedClassrooms = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Classroom[];
        // Manual sort on the client-side
        assignedClassrooms.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setClassrooms(assignedClassrooms);
        setLoading(false);
    }, (error) => {
        toast({ variant: "destructive", title: "Error fetching classrooms" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, toast]);

  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'TEACHER') return null;

  return (
    <div className="container py-8">
      <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage the classrooms you have been assigned to.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Your Assigned Classrooms</CardTitle>
            <CardDescription>A list of all the classrooms you can manage.</CardDescription>
        </CardHeader>
        <CardContent>
            {classrooms.length > 0 ? (
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Subject</TableHead>
                        <TableHead className="hidden sm:table-cell text-center">Admin</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {classrooms.map((classroom) => (
                        <TableRow key={classroom.id}>
                          <TableCell className="font-medium">{classroom.title}</TableCell>
                          <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{classroom.subject}</Badge></TableCell>
                          <TableCell className="hidden sm:table-cell text-center">{classroom.creatorName}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/teacher/classroom/${classroom.id}`}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Manage
                                </Link>
                              </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">No classrooms assigned yet!</h3>
                <p className="text-muted-foreground mt-2">Once an admin assigns you to a classroom, it will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
