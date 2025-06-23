
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { format } from "date-fns";

import { type Assignment, type Submission, type Classroom } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, ExternalLink, File as FileIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TeacherAssignmentPage() {
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
    if (authLoading || !user || user.role !== 'TEACHER') return;

    if (!classroomId || !assignmentId) {
        router.push('/dashboard/teacher');
        return;
    }

    const checkPermissionsAndFetch = async () => {
        setLoading(true);
        try {
            const classroomDocRef = doc(db, 'classrooms', classroomId);
            const classroomDoc = await getDoc(classroomDocRef);
            if (!classroomDoc.exists()) throw new Error('Classroom not found.');
            
            const classroomData = classroomDoc.data() as Classroom;
            if (!classroomData.teacherIds?.includes(user.uid) && classroomData.creatorId !== user.uid) {
                throw new Error('You are not assigned to this classroom.');
            }

            const assignmentDocRef = doc(db, `classrooms/${classroomId}/assignments`, assignmentId);
            const assignmentDoc = await getDoc(assignmentDocRef);
            if (!assignmentDoc.exists()) throw new Error('Assignment not found.');
            
            setAssignment({ id: assignmentDoc.id, ...assignmentDoc.data() } as Assignment);
            
            const submissionsQuery = query(collection(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`), orderBy('submittedAt', 'desc'));
            const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
              setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
            });
            
            setLoading(false);
            return unsubscribe;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            router.push(`/dashboard/teacher/classroom/${classroomId}`);
            return () => {};
        }
    };

    const unsubscribePromise = checkPermissionsAndFetch();

    return () => {
      unsubscribePromise.then(unsub => unsub());
    };

  }, [classroomId, assignmentId, user, authLoading, router, toast]);

  if (loading || authLoading) {
    return (
        <div className="container py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href={`/dashboard/teacher/classroom/${classroomId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classroom
        </Link>
      </Button>

      <main className="space-y-6">
        <div>
            <p className="text-sm font-medium text-primary">Assignment Details</p>
            <h1 className="text-3xl md:text-4xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground mt-1">Due: {assignment.dueDate ? format(assignment.dueDate.toDate(), 'PPP') : 'No due date'}</p>
        </div>
        
        {assignment.description && (
            <Card><CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p></CardContent>
            </Card>
        )}

        <Card>
            <CardHeader><CardTitle>Student Submissions</CardTitle><CardDescription>{submissions.length} submission(s).</CardDescription></CardHeader>
            <CardContent>
                {submissions.length > 0 ? (
                    <div className="border rounded-md">
                        <Table><TableHeader><TableRow><TableHead><User className="inline-block h-4 w-4 mr-2" />Student</TableHead><TableHead><Calendar className="inline-block h-4 w-4 mr-2" />Submitted</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {submissions.map(submission => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">{submission.studentName}</TableCell>
                                        <TableCell>{submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild><Button variant="outline" size="sm">View Submission</Button></DialogTrigger>
                                                <DialogContent className="sm:max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Submission from {submission.studentName}</DialogTitle>
                                                        <DialogDescription>
                                                           Submitted on {submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-64 mt-4 p-4 border rounded-md bg-secondary/50 space-y-4">
                                                        {submission.content && (
                                                            <div>
                                                                <h4 className="font-semibold mb-2 text-sm text-foreground">Text Response</h4>
                                                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{submission.content}</p>
                                                            </div>
                                                        )}
                                                        {submission.fileUrl && (
                                                            <div>
                                                                <h4 className="font-semibold mb-2 text-sm text-foreground">Attached File</h4>
                                                                <Button asChild variant="outline">
                                                                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                                        {submission.fileName || 'View File'}
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {!submission.content && !submission.fileUrl && (
                                                            <p className="text-muted-foreground text-sm">No content or file was submitted.</p>
                                                        )}
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : <div className="text-center py-10"><p className="text-muted-foreground">No submissions yet.</p></div>}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
