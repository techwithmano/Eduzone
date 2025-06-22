
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';

import { type Classroom, type Announcement, type Assignment, type Quiz, type Material } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Megaphone, FileText, Notebook, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementCard } from '@/components/announcement-card';
import { AssignmentCard } from '@/components/assignment-card';
import { QuizCard } from '@/components/quiz-card';
import { MaterialCard } from '@/components/material-card';

export default function StudentClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const classroomId = params.classroomId as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
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
            toast({ variant: 'destructive', title: 'Access Denied', description: 'You are not enrolled in this classroom.' });
            router.push('/dashboard/student');
          }
        } else {
          console.error("Classroom not found.");
          toast({ variant: 'destructive', title: 'Error', description: 'Classroom not found.' });
          router.push('/dashboard/student');
        }
      } catch (error) {
        console.error("Error fetching classroom:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [classroomId, user, authLoading, router, toast]);

   useEffect(() => {
    if (!classroomId) return;
    
    const unsubscribers: Unsubscribe[] = [];
    const collections = {
        announcements: setAnnouncements,
        assignments: setAssignments,
        quizzes: setQuizzes,
        materials: setMaterials,
    };

    Object.entries(collections).forEach(([collectionName, setter]) => {
        const q = query(collection(db, `classrooms/${classroomId}/${collectionName}`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setter(items as any);
        }, (err) => {
            console.error(`Error fetching ${collectionName}:`, err);
        });
        unsubscribers.push(unsubscribe);
    });

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
            <h1 className="text-2xl font-bold">Classroom not found or access denied.</h1>
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4" />Announcements</TabsTrigger>
          <TabsTrigger value="assignments"><FileText className="mr-2 h-4 w-4" />Assignments</TabsTrigger>
          <TabsTrigger value="quizzes"><Notebook className="mr-2 h-4 w-4" />Quizzes</TabsTrigger>
          <TabsTrigger value="materials"><BookOpen className="mr-2 h-4 w-4" />Materials</TabsTrigger>
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
                <p className="text-muted-foreground text-center py-4">No announcements yet.</p>
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
                <p className="text-muted-foreground text-center py-4">No assignments have been posted yet.</p>
               )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quizzes">
           <Card>
            <CardHeader>
              <CardTitle>Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {quizzes.length > 0 ? (
                 quizzes.map(quiz => (
                    <QuizCard key={quiz.id} classroomId={classroomId} quiz={quiz} />
                 ))
               ) : (
                <p className="text-muted-foreground text-center py-4">No quizzes have been posted yet.</p>
               )}
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="materials">
           <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {materials.length > 0 ? (
                 materials.map(material => (
                    <MaterialCard key={material.id} material={material} />
                 ))
               ) : (
                <p className="text-muted-foreground text-center py-4">No materials have been posted yet.</p>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
