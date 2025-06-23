
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { type Assignment, type Classroom, type Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, File as FileIcon, ExternalLink, Download, Paperclip, X, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const gradeSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

const GradeForm = ({ submission, classroomId, assignmentId }: { submission: Submission, classroomId: string, assignmentId: string }) => {
    const { toast } = useToast();
    const [isGrading, setIsGrading] = useState(false);
    const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    const form = useForm<z.infer<typeof gradeSchema>>({
        resolver: zodResolver(gradeSchema),
        defaultValues: { grade: 0, feedback: "" },
    });
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].size > 10 * 1024 * 1024) { // 10MB limit
                toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a file smaller than 10MB.' });
                return;
            }
            setFeedbackFile(e.target.files[0]);
        }
    };

    const handleGradeSubmit = async (values: z.infer<typeof gradeSchema>) => {
        setIsGrading(true);
        setUploadProgress(0);
        try {
            let fileInfo: { url: string, name: string } | undefined;

            if (feedbackFile) {
                const storageRef = ref(storage, `feedback/${classroomId}/${assignmentId}/${submission.studentId}/${feedbackFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, feedbackFile);

                uploadTask.on('state_changed',
                    (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
                );

                await uploadTask; // Wait for upload to complete
                
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                fileInfo = { url: downloadURL, name: feedbackFile.name };
            }

            const submissionDocRef = doc(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`, submission.id);
            await updateDoc(submissionDocRef, {
                status: 'graded',
                grade: values.grade,
                teacherFeedback: values.feedback,
                gradedAt: serverTimestamp(),
                ...(fileInfo && { teacherFeedbackFileUrl: fileInfo.url, teacherFeedbackFileName: fileInfo.name }),
            });
            
            toast({ title: 'Success!', description: `Grade has been returned to ${submission.studentName}.` });
        } catch (error) {
            console.error("Grading error: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit the grade.' });
        } finally {
            setIsGrading(false);
            setUploadProgress(0);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(handleGradeSubmit)} className="space-y-6 pt-4">
            <div className="space-y-2">
                <Label htmlFor="grade">Grade: {form.watch('grade')}/100</Label>
                <Slider id="grade" min={0} max={100} step={1} defaultValue={[0]} onValueChange={(val) => form.setValue('grade', val[0])}/>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea id="feedback" placeholder="Provide detailed feedback..." {...form.register('feedback')} className="min-h-[100px]" />
            </div>

            <div className="space-y-2">
                <Label>Return Graded File (Optional)</Label>
                {feedbackFile && (
                    <div className="p-2 border rounded-md flex items-center justify-between text-sm bg-secondary">
                        <div className="flex items-center gap-2 truncate"><FileIcon className="h-4 w-4 shrink-0" /><span className="truncate">{feedbackFile.name}</span></div>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFeedbackFile(null)}><X className="h-4 w-4" /></Button>
                    </div>
                )}
                <Button type="button" variant="outline" asChild><label htmlFor="feedback-file" className="w-full cursor-pointer"><Paperclip className="mr-2 h-4 w-4" />{feedbackFile ? 'Replace File' : 'Attach File'}</label></Button>
                <Input id="feedback-file" type="file" className="sr-only" onChange={handleFileChange} />
            </div>

            {isGrading && uploadProgress > 0 && <Progress value={uploadProgress} />}

            <Button type="submit" disabled={isGrading} className="w-full">
                {isGrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Return Grade to Student
            </Button>
        </form>
    );
};


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
            const unsubAssignment = onSnapshot(assignmentDocRef, (docSnap) => {
                if(docSnap.exists()){
                    setAssignment({ id: docSnap.id, ...docSnap.data() } as Assignment);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Assignment not found.' });
                    router.push(`/dashboard/teacher/classroom/${classroomId}`);
                }
            });
            
            const submissionsQuery = query(collection(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`), orderBy('submittedAt', 'desc'));
            const unsubSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
              setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
              setLoading(false);
            });
            
            return () => {
                unsubAssignment();
                unsubSubmissions();
            };
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            router.push(`/dashboard/teacher/classroom/${classroomId}`);
            setLoading(false);
            return () => {};
        }
    };

    const unsubscribePromise = checkPermissionsAndFetch();

    return () => {
      unsubscribePromise.then(unsub => unsub && unsub());
    };

  }, [classroomId, assignmentId, user, authLoading, router, toast]);

  if (loading || authLoading) {
    return <div className="container py-8"><Skeleton className="h-96 w-full" /></div>;
  }
  if (!assignment) return null;

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href={`/dashboard/teacher/classroom/${classroomId}`}>
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
                                                            {submission.content && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{submission.content}</p>}
                                                            {submission.fileUrl && <Button asChild variant="outline"><a href={submission.fileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />{submission.fileName || 'View File'}</a></Button>}
                                                            {!submission.content && !submission.fileUrl && <p className="text-muted-foreground text-sm">No content or file was submitted.</p>}
                                                        </div>
                                                        {submission.status === 'graded' ? (
                                                            <div className="p-4 border rounded-md space-y-3">
                                                                <h4 className="font-semibold text-lg">Grade & Feedback</h4>
                                                                <p className="text-2xl font-bold">{submission.grade}/100</p>
                                                                {submission.teacherFeedback && <p className="text-muted-foreground text-sm whitespace-pre-wrap">{submission.teacherFeedback}</p>}
                                                                {submission.teacherFeedbackFileUrl && <Button asChild variant="secondary"><a href={submission.teacherFeedbackFileUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />{submission.teacherFeedbackFileName || 'Download Graded File'}</a></Button>}
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
