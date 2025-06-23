
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { type Assignment, type Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, File as FileIcon, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

const gradeSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

const GradeForm = ({ submission, classroomId, assignmentId }: { submission: Submission, classroomId: string, assignmentId: string }) => {
    const { toast } = useToast();
    const [isGrading, setIsGrading] = useState(false);
    
    const form = useForm<z.infer<typeof gradeSchema>>({
        resolver: zodResolver(gradeSchema),
        defaultValues: { grade: submission.grade || 0, feedback: submission.teacherFeedback || "" },
    });
        
    const handleGradeSubmit = async (values: z.infer<typeof gradeSchema>) => {
        setIsGrading(true);
        try {
            const submissionDocRef = doc(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`, submission.id);
            await updateDoc(submissionDocRef, {
                status: 'graded',
                grade: values.grade,
                teacherFeedback: values.feedback,
                gradedAt: serverTimestamp(),
            });

            toast({ title: 'Success!', description: `Grade has been returned to ${submission.studentName}.` });
        } catch (error) {
            console.error("Grading error: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit the grade. Please try again.' });
        } finally {
            setIsGrading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(handleGradeSubmit)} className="space-y-6 pt-4">
            <div className="space-y-2">
                <Label htmlFor="grade">Grade: {form.watch('grade')}/100</Label>
                <Slider id="grade" min={0} max={100} step={1} defaultValue={[form.getValues('grade')]} onValueChange={(val) => form.setValue('grade', val[0])}/>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea id="feedback" placeholder="Provide detailed feedback..." {...form.register('feedback')} className="min-h-[100px]" />
            </div>

            <Button type="submit" disabled={isGrading} className="w-full">
                {isGrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Return Grade to Student
            </Button>
        </form>
    );
};

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
    setLoading(true);
    // Fetch assignment details
    const assignmentDocRef = doc(db, `classrooms/${classroomId}/assignments`, assignmentId);
    const unsubAssignment = onSnapshot(assignmentDocRef, (docSnap) => {
        if(docSnap.exists()){
            setAssignment({ id: docSnap.id, ...docSnap.data() } as Assignment);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Assignment not found.' });
            router.push(`/dashboard/admin/classroom/${classroomId}`);
        }
    });
    // Listen for submissions
    const submissionsQuery = query(collection(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`), orderBy('submittedAt', 'desc'));
    const unsubSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
      setLoading(false);
    }, () => setLoading(false));

    return () => {
      unsubAssignment();
      unsubSubmissions();
    };

  }, [classroomId, assignmentId, user, authLoading, router, toast]);

  if (loading || authLoading) {
    return <div className="container py-8"><Skeleton className="h-96 w-full" /></div>;
  }
  if (!assignment) return null;

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href={`/dashboard/admin/classroom/${classroomId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classroom
        </Link>
      </Button>

      <main className="space-y-6">
        <div>
            <p className="text-sm font-medium text-primary">Assignment Details</p>
            <h1 className="text-3xl md:text-4xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground mt-1">Due: {assignment.dueDate ? format(assignment.dueDate.toDate(), 'PPP') : 'No due date'}</p>
        </div>
        
        {assignment.description && <Card><CardHeader><CardTitle>Instructions</CardTitle></CardHeader><CardContent><p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p></CardContent></Card>}

        <Card>
            <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
                <CardDescription>{submissions.length} student(s) have submitted their work.</CardDescription>
            </CardHeader>
            <CardContent>
                {submissions.length > 0 ? (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader><TableRow><TableHead><User className="inline-block h-4 w-4 mr-2" />Student</TableHead><TableHead>Status</TableHead><TableHead className="text-center">Grade</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {submissions.map(submission => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">{submission.studentName}</TableCell>
                                        <TableCell><Badge variant={submission.status === 'graded' ? 'default' : 'secondary'} className="capitalize">{submission.status}</Badge></TableCell>
                                        <TableCell className="text-center font-medium">{submission.status === 'graded' ? `${submission.grade}/100` : '–'}</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">{submission.status === 'graded' ? 'View Grade' : 'Grade'}</Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Submission from {submission.studentName}</DialogTitle>
                                                        <DialogDescription>Submitted on {submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}</DialogDescription>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-[60vh] p-1">
                                                        <div className="p-4 border rounded-md bg-secondary/50 space-y-4 mb-4">
                                                            {assignment.submissionFolderUrl ? (
                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-semibold">Student work is in Google Drive.</p>
                                                                    <p className="text-xs text-muted-foreground">The student was instructed to name the file <code className="bg-muted p-1 rounded-sm font-mono">{submission.studentId}_{assignmentId}</code>.</p>
                                                                    <Button asChild variant="outline">
                                                                        <a href={assignment.submissionFolderUrl} target="_blank" rel="noopener noreferrer">
                                                                            <ExternalLink className="mr-2 h-4 w-4"/>
                                                                            Open Submission Folder
                                                                        </a>
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                submission.fileUrl && <Button asChild variant="outline"><a href={submission.fileUrl} target="_blank" download={submission.fileName || 'submission'} rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />{submission.fileName || 'Download File'}</a></Button>
                                                            )}
                                                            
                                                            {submission.content && (
                                                                <div>
                                                                    <p className="text-sm font-semibold mt-4">Student's Comment:</p>
                                                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{submission.content}</p>
                                                                </div>
                                                            )}
                                                            
                                                            {!assignment.submissionFolderUrl && !submission.content && !submission.fileUrl && <p className="text-muted-foreground text-sm">No content or file was submitted.</p>}
                                                        </div>
                                                        {submission.status === 'graded' ? (
                                                            <div className="p-4 border rounded-md space-y-3">
                                                                <h4 className="font-semibold text-lg">Grade & Feedback</h4>
                                                                <p className="text-2xl font-bold">{submission.grade}/100</p>
                                                                {submission.teacherFeedback && <p className="text-muted-foreground text-sm whitespace-pre-wrap">{submission.teacherFeedback}</p>}
                                                            </div>
                                                        ) : (
                                                            <GradeForm submission={submission} classroomId={classroomId} assignmentId={assignmentId}/>
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
