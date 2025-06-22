
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';

import { type Classroom } from '@/components/classroom-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const classroomId = params.classroomId as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!classroomId) {
      router.push('/dashboard/student');
      return;
    }

    const fetchClassroom = async () => {
      setLoading(true);
      try {
        const classroomDocRef = doc(db, "classrooms", classroomId);
        const classroomDoc = await getDoc(classroomDocRef);

        if (classroomDoc.exists()) {
          const classroomData = classroomDoc.data() as Omit<Classroom, 'id'>;
          // Security check: ensure student is enrolled
          if (classroomData.enrolledStudentIds?.includes(user.uid)) {
            setClassroom({ id: classroomDoc.id, ...classroomData });
          } else {
            console.error("Access denied: student not enrolled in this classroom.");
            router.push('/dashboard/student');
          }
        } else {
          console.error("Classroom not found.");
          router.push('/dashboard/student');
        }
      } catch (error) {
        console.error("Error fetching classroom:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [classroomId, user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classroom) {
    // This case is mostly handled by the redirect, but it's good for safety.
    return (
        <div className="container text-center py-20">
            <h1 className="text-2xl font-bold">Classroom not found or not enrolled.</h1>
            <Button asChild className="mt-4">
                <Link href="/dashboard/student">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard/student">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="mb-6">
        <Badge variant="secondary" className="mb-2">{classroom.subject}</Badge>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">{classroom.title}</h1>
        <p className="text-muted-foreground mt-1">Taught by {classroom.creatorName}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No announcements yet.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">No assignments yet.</p>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Course Materials</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">No materials uploaded yet.</p>
                </CardContent>
            </Card>
        </div>
      </div>

    </div>
  );
}
