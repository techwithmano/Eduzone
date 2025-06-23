
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { type Quiz, type QuizSubmission, type QuizAnswer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Loader2, Award, XCircle, Check, HelpCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const createQuizFormSchema = (questions: Quiz['questions'] = []) => {
    const schemaObject = questions.reduce((acc, question, index) => {
        acc[`question_${index}`] = z.string().min(1, { message: "Please provide an answer." });
        return acc;
    }, {} as Record<string, z.ZodString>);
    return z.object(schemaObject);
};

const QuizReview = ({ quiz, submission }: { quiz: Quiz, submission: QuizSubmission }) => {
    const getOptionClass = (answer: QuizAnswer, optionIndex: number) => {
        const isStudentAnswer = optionIndex === Number(answer.studentAnswer);
        const isCorrectAnswer = optionIndex === answer.correctAnswer;

        if (answer.isCorrect === undefined && isStudentAnswer) return "border-blue-500"; // Pending manual grade
        if (isCorrectAnswer) return "border-green-500 bg-green-500/10";
        if (isStudentAnswer && !isCorrectAnswer) return "border-red-500 bg-red-500/10";
        return "";
    };

    return (
        <div className="space-y-8">
            <Card className="text-center">
                <CardHeader>
                    <Award className="h-16 w-16 mx-auto text-yellow-500" />
                    <CardTitle className="text-2xl mt-4">Quiz Results</CardTitle>
                    <CardDescription>
                       {submission.status === 'fully-graded' ? "Your quiz has been graded." : submission.status === 'pending-review' ? "Some questions are pending manual review." : "Here are your results."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h2 className="text-4xl font-bold">{submission.score.toFixed(0)}%</h2>
                    <Progress value={submission.score} className="mt-6" />
                </CardContent>
                <CardFooter>
                     <p className="text-xs text-muted-foreground mx-auto">
                       Submitted on: {submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}
                     </p>
                </CardFooter>
            </Card>

            {quiz.questions.map((question, qIndex) => {
                const answer = submission.answers.find(a => a.question === question.question);
                if (!answer) return null;
                return (
                    <Card key={qIndex}>
                        <CardHeader>
                            <CardTitle>Question {qIndex + 1}</CardTitle>
                            <CardDescription>{question.question}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {question.type === 'multiple-choice' ? (
                                <RadioGroup value={String(answer.studentAnswer)} disabled className="space-y-2">
                                    {question.options?.map((option, oIndex) => (
                                        <div key={oIndex} className={cn("flex items-center space-x-3 space-y-0 p-3 rounded-md border transition-colors", getOptionClass(answer, oIndex))}>
                                            <RadioGroupItem value={String(oIndex)} id={`q${qIndex}o${oIndex}`} />
                                            <Label htmlFor={`q${qIndex}o${oIndex}`} className="font-normal w-full">{option}</Label>
                                            {oIndex === answer.correctAnswer && <Check className="h-5 w-5 text-green-500" />}
                                            {oIndex === Number(answer.studentAnswer) && oIndex !== answer.correctAnswer && <XCircle className="h-5 w-5 text-red-500" />}
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div>
                                    <p className="font-semibold text-sm mb-2">Your Answer:</p>
                                    <p className="text-muted-foreground p-3 bg-secondary rounded-md whitespace-pre-wrap">{String(answer.studentAnswer)}</p>
                                    {submission.status === 'fully-graded' && (
                                        <div className="mt-4 p-3 rounded-md border" >
                                            <div className="flex items-center gap-2 mb-2">
                                                {answer.isCorrect ? <CheckCircle className="h-5 w-5 text-green-500"/> : <XCircle className="h-5 w-5 text-red-500"/>}
                                                <p className="font-semibold">{answer.isCorrect ? "Correct" : "Incorrect"}</p>
                                            </div>
                                            {answer.teacherFeedback && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{answer.teacherFeedback}</p>}
                                        </div>
                                    )}
                                    {submission.status === 'pending-review' && (
                                        <div className="mt-4 p-3 rounded-md border flex items-center gap-2 text-sm text-muted-foreground">
                                            <HelpCircle className="h-4 w-4"/>
                                            <span>This answer is pending review by your teacher.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
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
        
        setLoading(true);
        const quizDocRef = doc(db, `classrooms/${classroomId}/quizzes`, quizId);
        const unsubQuiz = onSnapshot(quizDocRef, (quizDoc) => {
            if (quizDoc.exists()) {
                const quizData = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
                setQuiz(quizData);
                setFormSchema(createQuizFormSchema(quizData.questions));
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Quiz not found.' });
                router.push(`/dashboard/student/classroom/${classroomId}`);
            }
        });
        
        const submissionDocRef = doc(db, `classrooms/${classroomId}/quizzes/${quizId}/submissions`, user.uid);
        const unsubSubmission = onSnapshot(submissionDocRef, (submissionDoc) => {
            setSubmission(submissionDoc.exists() ? { id: submissionDoc.id, ...submissionDoc.data() } as QuizSubmission : null);
            setLoading(false);
        });

        return () => {
            unsubQuiz();
            unsubSubmission();
        }
    }, [classroomId, quizId, user, router, toast]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user || !quiz) return;
        setIsSubmitting(true);
        try {
            let correctAnswersCount = 0;
            let hasTypedAnswers = false;
            
            const answers: QuizAnswer[] = quiz.questions.map((question, index) => {
                const studentAnswerRaw = values[`question_${index}`];
                if (question.type === 'typed-answer') {
                    hasTypedAnswers = true;
                    return {
                        question: question.question,
                        questionType: 'typed-answer',
                        studentAnswer: studentAnswerRaw,
                    };
                } else { // multiple-choice
                    const studentAnswerIndex = parseInt(studentAnswerRaw);
                    const isCorrect = question.correctAnswer === studentAnswerIndex;
                    if (isCorrect) correctAnswersCount++;
                    return {
                        question: question.question,
                        questionType: 'multiple-choice',
                        studentAnswer: studentAnswerIndex,
                        isCorrect: isCorrect,
                        correctAnswer: question.correctAnswer,
                        options: question.options,
                    };
                }
            });

            const score = (correctAnswersCount / quiz.questions.length) * 100;

            const submissionData: Omit<QuizSubmission, 'id'> = {
                studentId: user.uid,
                studentName: user.displayName || 'Anonymous Student',
                answers,
                score,
                status: hasTypedAnswers ? 'pending-review' : 'auto-graded',
                totalQuestions: quiz.questions.length,
                submittedAt: Timestamp.now(),
            };

            const submissionDocRef = doc(db, `classrooms/${classroomId}/quizzes/${quizId}/submissions`, user.uid);
            await setDoc(submissionDocRef, submissionData);

            toast({ title: 'Quiz Submitted!', description: `Your answers have been recorded.` });

        } catch (error) {
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
                    <Link href={`/dashboard/student/classroom/${classroomId}?tab=quizzes`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Classroom
                    </Link>
                </Button>
                <QuizReview quiz={quiz} submission={submission} />
            </div>
        )
    }

    return (
        <div className="container py-8 max-w-3xl mx-auto">
            <Button variant="ghost" asChild className="mb-6 -ml-4">
                <Link href={`/dashboard/student/classroom/${classroomId}?tab=quizzes`}>
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
                                                {q.type === 'multiple-choice' ? (
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                                                        {q.options?.map((option, optionIndex) => (
                                                            <FormItem key={optionIndex} className="flex items-center space-x-3 space-y-0 p-3 rounded-md border border-transparent hover:border-primary transition-colors">
                                                                <FormControl>
                                                                    <RadioGroupItem value={String(optionIndex)} />
                                                                </FormControl>
                                                                <FormLabel className="font-normal w-full cursor-pointer">{option}</FormLabel>
                                                            </FormItem>
                                                        ))}
                                                    </RadioGroup>
                                                ) : (
                                                    <Textarea placeholder="Type your answer here..." {...field} className="min-h-[120px]" />
                                                )}
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
