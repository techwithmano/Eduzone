
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { format } from "date-fns";

import { type Assignment, type Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, Check, Circle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const classroomId = params.classroomId as string;
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'ADMIN') return;

    if (!classroomId || !assignmentId) {
        router.push('/dashboard/admin');
        return;
    }

    const fetchAssignment = async () => {
        try {
            const assignmentDocRef = doc(db, `classrooms/${classroomId}/assignments`, assignmentId);
            const assignmentDoc = await getDoc(assignmentDocRef);
            if (assignmentDoc.exists()) {
                const data = assignmentDoc.data();
                const classroomDocRef = doc(db, 'classrooms', classroomId);
                const classroomDoc = await getDoc(classroomDocRef);
                if (classroomDoc.exists() && classroomDoc.data().creatorId === user.uid) {
                    setAssignment({ id: assignmentDoc.id, ...data } as Assignment);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'You do not have permission to view this assignment.' });
                    router.push(`/dashboard/admin/classroom/${classroomId}`);
                }
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Assignment not found.' });
                router.push(`/dashboard/admin/classroom/${classroomId}`);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load assignment data.' });
        }
    };

    const setupListeners = async () => {
        setLoading(true);
        await fetchAssignment();
        const submissionsQuery = query(collection(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`), orderBy('submittedAt', 'desc'));
        const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
          const fetchedSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
          setSubmissions(fetchedSubmissions);
        }, (error) => {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch submissions.' });
        });
        setLoading(false);
        return () => unsubscribeSubmissions();
    }

    const unsubscribePromise = setupListeners();

    return () => {
      unsubscribePromise.then(unsub => unsub && unsub());
    };

  }, [classroomId, assignmentId, user, authLoading, router, toast]);

  if (loading || authLoading) {
    return (
        <div className="container py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href={`/dashboard/admin/classroom/${classroomId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classroom
        </Link>
      </Button>

      <main className="space-y-6">
        <div>
            <p className="text-sm font-medium text-primary">Assignment Details</p>
            <h1 className="text-3xl md:text-4xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground mt-1">
                Due: {assignment.dueDate ? format(assignment.dueDate.toDate(), 'PPP') : 'No due date'}
            </p>
        </div>
        
        {assignment.description && (
            <Card>
                <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
                <CardDescription>
                    {submissions.length} student(s) have submitted their work.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {submissions.length > 0 ? (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><User className="inline-block h-4 w-4 mr-2" />Student Name</TableHead>
                                    <TableHead><Calendar className="inline-block h-4 w-4 mr-2" />Submitted On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.map(submission => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">{submission.studentName}</TableCell>
                                        <TableCell>{submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">View & Grade</Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Submission from {submission.studentName}</DialogTitle>
                                                        <DialogDescription>
                                                           Submitted on {submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}
                                                           {submission.resubmittedAt && ` (Resubmitted on ${format(submission.resubmittedAt.toDate(), 'PPP p')})`}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-64 mt-4 p-4 border rounded-md bg-secondary/50">
                                                       <p className="whitespace-pre-wrap text-sm">{submission.content}</p>
                                                    </ScrollArea>
                                                     {/* Grading form can be added here in the future */}
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No submissions yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
