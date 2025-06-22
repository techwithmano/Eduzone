
"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { ClassroomCard, type Classroom } from "@/components/classroom-card";
import { CourseCardSkeleton } from "@/components/course-card-skeleton";

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (user.role !== "STUDENT") {
      router.push("/dashboard");
      return;
    }

    const fetchEnrolledClassrooms = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Query classrooms where the user's ID is in the enrolledStudentIds array
        const classroomsQuery = query(collection(db, "classrooms"), where("enrolledStudentIds", "array-contains", user.uid));
        const classroomsSnapshot = await getDocs(classroomsQuery);
        
        const fetchedClassrooms = classroomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
        setClassrooms(fetchedClassrooms);

      } catch (error) {
        console.error("Error fetching enrolled classrooms: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledClassrooms();

  }, [user, authLoading, router]);

  if (authLoading) {
     return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'STUDENT') {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
             Welcome, {user.displayName || user.email}!
          </h1>
          {user.role && <Badge>{user.role}</Badge>}
        </div>
        <p className="text-muted-foreground">Here are the classrooms you are currently enrolled in.</p>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </>
        ) : classrooms.length > 0 ? (
          classrooms.map(classroom => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))
        ) : (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">You are not enrolled in any classrooms yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

       <Card className="mt-8">
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
  );
}
