
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { type Quiz, type QuizSubmission, type QuizQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Loader2, Award, Percent } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const createQuizFormSchema = (questions: QuizQuestion[] = []) => {
    const schemaObject = questions.reduce((acc, question, index) => {
        acc[`question_${index}`] = z.string({ required_error: "Please select an answer." });
        return acc;
    }, {} as Record<string, z.ZodString>);
    return z.object(schemaObject);
};


export default function StudentQuizPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const classroomId = params.classroomId as string;
    const quizId = params.quizId as string;

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [submission, setSubmission] = useState<QuizSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formSchema, setFormSchema] = useState(createQuizFormSchema());
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (!classroomId || !quizId || !user) return;
        
        const quizDocRef = doc(db, `classrooms/${classroomId}/quizzes`, quizId);
        const submissionDocRef = doc(db, `classrooms/${classroomId}/quizzes/${quizId}/submissions`, user.uid);

        const fetchQuizAndSubmission = async () => {
            setLoading(true);
            try {
                const quizDoc = await getDoc(quizDocRef);
                if (quizDoc.exists()) {
                    const quizData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
                    setQuiz(quizData);
                    const newSchema = createQuizFormSchema(quizData.questions);
                    setFormSchema(newSchema);
                    form.reset(undefined, { keepDefaultValues: true }); // Reset form with new schema
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Quiz not found.' });
                    router.push(`/dashboard/student/classroom/${classroomId}`);
                }
                
                const submissionDoc = await getDoc(submissionDocRef);
                if (submissionDoc.exists()) {
                    setSubmission(submissionDoc.data() as QuizSubmission);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load quiz data.' });
            } finally {
                setLoading(false);
            }
        };

        fetchQuizAndSubmission();
    }, [classroomId, quizId, user, router, toast]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user || !quiz) return;
        setIsSubmitting(true);
        try {
            let correctAnswers = 0;
            const answers = Object.entries(values).map(([key, value]) => {
                const questionIndex = parseInt(key.split('_')[1]);
                const question = quiz.questions[questionIndex];
                const selectedOptionIndex = parseInt(value);
                if (question.correctAnswer === selectedOptionIndex) {
                    correctAnswers++;
                }
                return { question: question.question, answer: selectedOptionIndex };
            });

            const score = (correctAnswers / quiz.questions.length) * 100;

            const submissionData: Omit<QuizSubmission, 'id'> = {
                studentId: user.uid,
                studentName: user.displayName || 'Anonymous Student',
                answers,
                score,
                totalQuestions: quiz.questions.length,
                submittedAt: serverTimestamp() as any,
            };

            const submissionDocRef = doc(db, `classrooms/${classroomId}/quizzes/${quizId}/submissions`, user.uid);
            await setDoc(submissionDocRef, submissionData);
            setSubmission(submissionData as QuizSubmission);

            toast({ title: 'Quiz Submitted!', description: `You scored ${score.toFixed(0)}%` });

        } catch (error) {
            console.error("Error submitting quiz:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your answers.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading || authLoading) {
        return (
            <div className="container py-8">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    if (!quiz) return null;

    if (submission) {
        return (
            <div className="container py-8 max-w-3xl mx-auto">
                <Button variant="ghost" asChild className="mb-6 -ml-4">
                    <Link href={`/dashboard/student/classroom/${classroomId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Classroom
                    </Link>
                </Button>
                <Card className="text-center">
                    <CardHeader>
                        <Award className="h-16 w-16 mx-auto text-yellow-500" />
                        <CardTitle className="text-2xl mt-4">Quiz Results</CardTitle>
                        <CardDescription>You have already completed this quiz.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h2 className="text-4xl font-bold">{submission.score.toFixed(0)}%</h2>
                        <p className="text-muted-foreground mt-2">
                           You answered { (submission.score / 100) * submission.totalQuestions } out of {submission.totalQuestions} questions correctly.
                        </p>
                        <Progress value={submission.score} className="mt-6" />
                    </CardContent>
                    <CardFooter>
                         <p className="text-xs text-muted-foreground mx-auto">
                           Submitted on: {submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}
                         </p>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="container py-8 max-w-3xl mx-auto">
            <Button variant="ghost" asChild className="mb-6 -ml-4">
                <Link href={`/dashboard/student/classroom/${classroomId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Classroom
                </Link>
            </Button>
            
            <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold">{quiz.title}</h1>
                <p className="text-muted-foreground mt-1">{quiz.description}</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {quiz.questions.map((q, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle>Question {index + 1}</CardTitle>
                                <CardDescription>{q.question}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name={`question_${index}`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex flex-col space-y-2"
                                                >
                                                    {q.options.map((option, optionIndex) => (
                                                        <FormItem key={optionIndex} className="flex items-center space-x-3 space-y-0 p-3 rounded-md border border-transparent hover:border-primary transition-colors">
                                                            <FormControl>
                                                                <RadioGroupItem value={String(optionIndex)} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal w-full cursor-pointer">
                                                                {option}
                                                            </FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    ))}
                    <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Quiz
                    </Button>
                </form>
            </Form>
        </div>
    );
}
