
"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClassroomCard } from "@/components/classroom-card";
import { CourseCardSkeleton } from "@/components/course-card-skeleton";
import { type Classroom } from "@/lib/types";

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

    setLoading(true);
    // Use the enrolledClassroomIds from the user profile to query
    const classroomsQuery = query(collection(db, "classrooms"), where("enrolledStudentIds", "array-contains", user.uid));
    
    const unsubscribe = onSnapshot(classroomsQuery, (classroomsSnapshot) => {
        const fetchedClassrooms = classroomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
        setClassrooms(fetchedClassrooms);
        setLoading(false);
    }, (error) => {
        setLoading(false);
    });

    return () => unsubscribe();

  }, [user, authLoading, router]);

  if (authLoading || loading) {
     return (
      <div className="container py-8">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
             Student Dashboard
          </h1>
          <p className="text-muted-foreground">Loading your classrooms...</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
        </div>
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
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
             Welcome, {user.displayName || user.email}!
          </h1>
          {user.role && <Badge>{user.role}</Badge>}
        </div>
        <p className="text-muted-foreground">Here are the classrooms you are currently enrolled in.</p>
      </div>
      
      {classrooms.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map(classroom => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))}
        </div>
      ) : (
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardContent className="p-10 text-center">
            <h3 className="text-xl font-semibold">No Classrooms Yet</h3>
            <p className="text-muted-foreground mt-2">You are not enrolled in any classrooms. Once a teacher adds you, it will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
