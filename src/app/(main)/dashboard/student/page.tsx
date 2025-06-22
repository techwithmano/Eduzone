
"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { CourseCard, type Course } from "@/components/product-card";
import { CourseCardSkeleton } from "@/components/course-card-skeleton";

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
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

    const fetchEnrolledCourses = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // 1. Get the student's user document
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const courseIds = userData.enrolledCourseIds || [];
          
          if (courseIds.length > 0) {
            // 2. Fetch the courses using the array of IDs
            const coursesQuery = query(collection(db, "products"), where(documentId(), "in", courseIds));
            const coursesSnapshot = await getDocs(coursesQuery);
            
            const fetchedCourses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
            setCourses(fetchedCourses);
          } else {
            setCourses([]);
          }
        }
      } catch (error) {
        console.error("Error fetching enrolled courses: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();

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
        <p className="text-muted-foreground">Here are the courses you are currently enrolled in.</p>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </>
        ) : courses.length > 0 ? (
          courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
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
