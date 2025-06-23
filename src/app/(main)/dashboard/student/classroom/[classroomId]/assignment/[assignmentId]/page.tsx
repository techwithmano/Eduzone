
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { type Assignment, type Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Loader2, History, Paperclip, File as FileIcon, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const submissionSchema = z.object({
  content: z.string().max(5000, "Submission text cannot exceed 5000 characters.").optional(),
});

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<z.infer<typeof submissionSchema>>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { content: "" },
  });

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

  }, [classroomId, assignmentId, user, authLoading, router, toast]);

  useEffect(() => {
    if (!user) return;
    
    const submissionDocRef = doc(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`, user.uid);
    const unsubscribe = onSnapshot(submissionDocRef, (submissionDoc) => {
        if (submissionDoc.exists()) {
            const subData = { id: submissionDoc.id, ...submissionDoc.data() } as Submission;
            setSubmission(subData);
            form.reset({ content: subData.content || "" });
        } else {
            setSubmission(null);
        }
    }, (error) => {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load submission status.' });
    });

    return () => unsubscribe();

  }, [classroomId, assignmentId, user, toast, form]);

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
    
    // Check if there's any content to submit
    if (!values.content && !selectedFile && !submission?.fileUrl) {
      toast({
        variant: 'destructive',
        title: 'Empty Submission',
        description: 'Please write a message or upload a file to submit.',
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        let fileInfo: { fileUrl: string; fileName: string; fileType: string; } | {} = {};

        if (selectedFile) {
            const storageRef = ref(storage, `submissions/${classroomId}/${assignmentId}/${user.uid}/${selectedFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, selectedFile);
            
            await new Promise<void>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => {
                        console.error("Upload failed", error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        fileInfo = {
                            fileUrl: downloadURL,
                            fileName: selectedFile.name,
                            fileType: selectedFile.type,
                        };
                        resolve();
                    }
                );
            });
        }

        const submissionDocRef = doc(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`, user.uid);
        
        const submissionData: any = {
            studentId: user.uid,
            studentName: user.displayName || 'Anonymous Student',
            submittedAt: submission?.submittedAt || serverTimestamp(), // Preserve original submission time
            resubmittedAt: serverTimestamp(),
        };

        if (values.content) {
            submissionData.content = values.content;
        } else {
             submissionData.content = submission?.content || null; // keep old content if new is empty
        }

        if (Object.keys(fileInfo).length > 0) {
          submissionData.fileUrl = (fileInfo as any).fileUrl;
          submissionData.fileName = (fileInfo as any).fileName;
          submissionData.fileType = (fileInfo as any).fileType;
        }

        await setDoc(submissionDocRef, submissionData, { merge: true });
        
        toast({ title: 'Success!', description: `Your work for "${assignment.title}" has been submitted.` });
        setSelectedFile(null); // Clear selected file after submission
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your work.' });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
    }
  };


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
                <div className="md:col-span-1">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (!assignment) {
      return null;
  }

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
        </main>

        <aside className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {submission ? <CheckCircle className="h-5 w-5 text-green-500" /> : <History className="h-5 w-5 text-yellow-500" />}
                        Your Work
                    </CardTitle>
                    <CardDescription>
                       {submission ? 'You have submitted your work. You can resubmit if needed.' : 'Submit your work here.'}
                       {submission?.submittedAt && (
                         <span className="text-xs block mt-1">
                           Last submitted: {format(submission.submittedAt.toDate(), 'PPP p')}
                         </span>
                       )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Response</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Type a message or response here..."
                                        className="min-h-[150px]"
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            
                            <div className="space-y-2">
                              <FormLabel>Attach File</FormLabel>
                               {submission?.fileUrl && !selectedFile && (
                                <div className="p-2 border rounded-md flex items-center justify-between text-sm bg-secondary">
                                  <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate text-primary hover:underline">
                                    <FileIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate font-medium">{submission.fileName}</span>
                                  </a>
                                </div>
                              )}
                              {selectedFile && (
                                <div className="p-2 border rounded-md flex items-center justify-between text-sm bg-secondary">
                                  <div className="flex items-center gap-2 truncate">
                                    <FileIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{selectedFile.name}</span>
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              <FormControl>
                                <Button type="button" variant="outline" asChild>
                                  <label htmlFor="file-upload" className="w-full cursor-pointer">
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    {submission?.fileUrl || selectedFile ? 'Replace File' : 'Choose File'}
                                  </label>
                                </Button>
                              </FormControl>
                              <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                            </div>

                            {isSubmitting && uploadProgress > 0 && <Progress value={uploadProgress} className="w-full" />}

                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {submission ? 'Resubmit' : 'Submit'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </aside>
      </div>

    </div>
  );
}
