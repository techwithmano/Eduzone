
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';

import { type Classroom, type Announcement, type Assignment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Megaphone, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementCard } from '@/components/announcement-card';
import { AssignmentCard } from '@/components/assignment-card';

export default function StudentClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const classroomId = params.classroomId as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
          if (user.enrolledClassroomIds?.includes(classroomDoc.id)) {
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

   useEffect(() => {
    if (!classroomId) return;
    
    const unsubscribers: Unsubscribe[] = [];

    // Subscribe to announcements
    const announcementsQuery = query(collection(db, `classrooms/${classroomId}/announcements`), orderBy('createdAt', 'desc'));
    const announcementsUnsub = onSnapshot(announcementsQuery, (snapshot) => {
      const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(fetchedAnnouncements);
    });
    unsubscribers.push(announcementsUnsub);

    // Subscribe to assignments
    const assignmentsQuery = query(collection(db, `classrooms/${classroomId}/assignments`), orderBy('createdAt', 'desc'));
    const assignmentsUnsub = onSnapshot(assignmentsQuery, (snapshot) => {
      const fetchedAssignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
      setAssignments(fetchedAssignments);
    });
    unsubscribers.push(assignmentsUnsub);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [classroomId]);

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
      <Button variant="ghost" asChild className="mb-6 -ml-4">
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

       <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4" />Announcements</TabsTrigger>
          <TabsTrigger value="assignments"><FileText className="mr-2 h-4 w-4" />Assignments</TabsTrigger>
          <TabsTrigger value="quizzes" disabled>Quizzes</TabsTrigger>
        </TabsList>
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))
              ) : (
                <p className="text-muted-foreground">No announcements yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assignments">
           <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {assignments.length > 0 ? (
                 assignments.map(assignment => (
                    <AssignmentCard key={assignment.id} classroomId={classroomId} assignment={assignment} />
                 ))
               ) : (
                <p className="text-muted-foreground">No assignments have been posted yet.</p>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
