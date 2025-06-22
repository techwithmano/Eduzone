
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { type Assignment, type Submission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Loader2, History } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


const submissionSchema = z.object({
  content: z.string().min(10, "Submission must be at least 10 characters long.").max(5000, "Submission cannot exceed 5000 characters."),
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

    const fetchAssignmentAndSubmission = async () => {
        setLoading(true);
        try {
            const assignmentDocRef = doc(db, `classrooms/${classroomId}/assignments`, assignmentId);
            const assignmentDoc = await getDoc(assignmentDocRef);
            if (assignmentDoc.exists()) {
                setAssignment({ id: assignmentDoc.id, ...assignmentDoc.data() } as Assignment);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Assignment not found.' });
                router.push(`/dashboard/student/classroom/${classroomId}`);
                return;
            }

            const submissionDocRef = doc(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`, user.uid);
            const submissionDoc = await getDoc(submissionDocRef);
            if (submissionDoc.exists()) {
                const subData = { id: submissionDoc.id, ...submissionDoc.data() } as Submission;
                setSubmission(subData);
                form.reset({ content: subData.content });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load assignment data.' });
        } finally {
            setLoading(false);
        }
    };

    fetchAssignmentAndSubmission();

  }, [classroomId, assignmentId, user, authLoading, router, toast, form]);

  const onSubmit = async (values: z.infer<typeof submissionSchema>) => {
    if (!user || !assignment) return;
    setIsSubmitting(true);
    try {
        const submissionDocRef = doc(db, `classrooms/${classroomId}/assignments/${assignmentId}/submissions`, user.uid);
        
        const submissionData: Partial<Submission> = {
            studentId: user.uid,
            studentName: user.displayName || 'Anonymous Student',
            content: values.content,
            submittedAt: serverTimestamp() as any,
        };

        if(submission) {
            // This is a resubmission, keep original submission time if needed, but we'll overwrite for simplicity
            submissionData.resubmittedAt = serverTimestamp() as any;
        }

        await setDoc(submissionDocRef, submissionData, { merge: true });
        
        setSubmission(prev => ({ ...prev, ...submissionData, id: user.uid } as Submission));
        toast({ title: 'Success!', description: `Your work for "${assignment.title}" has been submitted.` });
    } catch (error) {
        console.error("Error submitting work:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your work.' });
    } finally {
        setIsSubmitting(false);
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
                    <CardHeader><CardTitle className="text-lg">Instructions</CardTitle></CardHeader>
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
                       {submission ? 'You have submitted your work.' : 'Submit your work here. You can paste text or a link to a file.'}
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
                                    <FormLabel className="sr-only">Your Submission</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Type your response or paste a link here..."
                                        className="min-h-[200px]"
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
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
