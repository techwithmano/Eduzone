
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { type Assignment, type Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Loader2, History, Paperclip, File as FileIcon, X, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const submissionSchema = z.object({
  content: z.string().max(5000, "Submission text cannot exceed 5000 characters.").optional(),
  file: z.any().optional()
});

const SubmissionForm = ({ assignment, classroomId, assignmentId }: { assignment: Assignment, classroomId: string, assignmentId: string}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const form = useForm<z.infer<typeof submissionSchema>>({
        resolver: zodResolver(submissionSchema),
        defaultValues: { content: "" },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].size > 10 * 1024 * 1024) { // 10MB limit
                toast({
                variant: 'destructive',
                title: 'File too large',
                description: 'Please upload a file smaller than 10MB.',
                });
                return;
            }
            setSelectedFile(e.target.files[0]);
        }
    };
    
    const onSubmit = async (values: z.infer<typeof submissionSchema>) => {
        if (!user || !assignment) return;
        if (!values.content && !selectedFile) {
            toast({ variant: 'destructive', title: 'Empty Submission', description: 'Please write a message or upload a file to submit.' });
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            let fileInfo: { fileUrl: string; fileName: string; } | undefined;

            if (selectedFile) {
                const storageRef = ref(storage, `submissions/${classroomId}/${assignmentId}/${user.uid}/${selectedFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, selectedFile);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    }
                );

                await uploadTask;

                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                fileInfo = { fileUrl: downloadURL, fileName: selectedFile.name };
            }

            const submissionDocRef = doc(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`, user.uid);
            
            const submissionData: Omit<Submission, 'id'> = {
                studentId: user.uid,
                studentName: user.displayName || 'Anonymous Student',
                status: 'submitted',
                submittedAt: serverTimestamp() as Timestamp,
                ...(values.content && { content: values.content }),
                ...(fileInfo && { fileUrl: fileInfo.fileUrl, fileName: fileInfo.fileName }),
            };

            await setDoc(submissionDocRef, submissionData);
            toast({ title: 'Success!', description: `Your work for "${assignment.title}" has been submitted.` });
            
        } catch (error) {
            console.error("Submission error: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your work. Please check your network connection or contact support.' });
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-yellow-500" />
                    Submit Your Work
                </CardTitle>
                <CardDescription>
                    Complete your submission below. You will not be able to edit it after submitting.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Response</FormLabel>
                                <FormControl><Textarea placeholder="Type a message or response here..." className="min-h-[150px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <div className="space-y-2">
                            <FormLabel>Attach File</FormLabel>
                            {selectedFile && (
                            <div className="p-2 border rounded-md flex items-center justify-between text-sm bg-secondary">
                                <div className="flex items-center gap-2 truncate">
                                    <FileIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{selectedFile.name}</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}><X className="h-4 w-4" /></Button>
                            </div>
                            )}
                            <FormControl>
                            <Button type="button" variant="outline" asChild>
                                <label htmlFor="file-upload" className="w-full cursor-pointer">
                                <Paperclip className="mr-2 h-4 w-4" />
                                {selectedFile ? 'Replace File' : 'Choose File'}
                                </label>
                            </Button>
                            </FormControl>
                            <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                        </div>
                        {isSubmitting && uploadProgress > 0 && <Progress value={uploadProgress} className="w-full" />}
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Assignment
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

const SubmissionReview = ({ submission }: { submission: Submission }) => {
    return (
        <Card>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Work Submitted
                </CardTitle>
                <CardDescription>
                    Submitted on: {submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Your Submission</h3>
                    <div className="p-4 bg-secondary rounded-md space-y-4">
                        {submission.content && <p className="text-muted-foreground whitespace-pre-wrap">{submission.content}</p>}
                        {submission.fileUrl && (
                            <Button asChild variant="outline">
                                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                <FileIcon className="mr-2 h-4 w-4" />{submission.fileName || 'View Submitted File'}
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
                 {submission.status === 'graded' && (
                    <div>
                        <Separator className="my-4"/>
                        <h3 className="font-semibold mb-2">Teacher's Feedback</h3>
                        <div className="p-4 border rounded-md space-y-4">
                            <div className="flex justify-between items-center">
                                <Badge>Graded</Badge>
                                <p className="text-2xl font-bold">{submission.grade ?? 0}<span className="text-base font-normal text-muted-foreground">/100</span></p>
                            </div>
                            {submission.teacherFeedback && <p className="text-muted-foreground whitespace-pre-wrap">{submission.teacherFeedback}</p>}
                            {submission.teacherFeedbackFileUrl && (
                                <Button asChild variant="secondary">
                                    <a href={submission.teacherFeedbackFileUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-4 w-4" />{submission.teacherFeedbackFileName || 'Download Graded File'}
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                 )}
            </CardContent>
        </Card>
    )
};


export default function StudentAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const classroomId = params.classroomId as string;
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    if (!classroomId || !assignmentId) {
        router.push('/dashboard/student');
        return;
    }

    const fetchAssignment = async () => {
        setLoading(true);
        try {
            const assignmentDocRef = doc(db, `classrooms/${classroomId}/assignments`, assignmentId);
            const assignmentDoc = await getDoc(assignmentDocRef);
            if (assignmentDoc.exists()) {
                setAssignment({ id: assignmentDoc.id, ...assignmentDoc.data() } as Assignment);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Assignment not found.' });
                router.push(`/dashboard/student/classroom/${classroomId}`);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load assignment data.' });
        } finally {
            setLoading(false);
        }
    };

    fetchAssignment();

    const submissionDocRef = doc(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`, user.uid);
    const unsubscribe = onSnapshot(submissionDocRef, (submissionDoc) => {
        setSubmission(submissionDoc.exists() ? { id: submissionDoc.id, ...submissionDoc.data() } as Submission : null);
    });

    return () => unsubscribe();

  }, [classroomId, assignmentId, user, authLoading, router, toast]);

  if (loading || authLoading) {
    return (
        <div className="container py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="md:col-span-1"><Skeleton className="h-64 w-full" /></div>
            </div>
        </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href={`/dashboard/student/classroom/${classroomId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classroom
        </Link>
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        <main className="md:col-span-2 space-y-6">
            <div>
                <p className="text-sm font-medium text-primary">Assignment</p>
                <h1 className="text-3xl md:text-4xl font-bold">{assignment.title}</h1>
                <p className="text-muted-foreground mt-1">Due: {assignment.dueDate ? format(assignment.dueDate.toDate(), 'PPP') : 'No due date'}</p>
            </div>
            {assignment.description && (
                <Card>
                    <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p></CardContent>
                </Card>
            )}
        </main>
        <aside className="md:col-span-1">
            {submission ? <SubmissionReview submission={submission} /> : <SubmissionForm assignment={assignment} classroomId={classroomId} assignmentId={assignmentId}/>}
        </aside>
      </div>

    </div>
  );
}
