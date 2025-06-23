
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { format } from "date-fns";

import { type Quiz, type QuizSubmission, type QuizAnswer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, Percent, Loader2, CheckCircle, XCircle, Check, HelpCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ManualGradeState = { [key: number]: { isCorrect: boolean; teacherFeedback: string } };

const QuizReviewAndGrade = ({ quiz, submission, onGrade }: { quiz: Quiz, submission: QuizSubmission, onGrade?: (grades: ManualGradeState) => void }) => {
    const isGradingMode = onGrade !== undefined && submission.status === 'pending-review';
    const [manualGrades, setManualGrades] = useState<ManualGradeState>({});

    const handleGradeChange = (qIndex: number, isCorrect: boolean) => {
        setManualGrades(prev => ({
            ...prev,
            [qIndex]: { ...prev[qIndex], isCorrect }
        }));
    };
    
    const handleFeedbackChange = (qIndex: number, feedback: string) => {
        setManualGrades(prev => ({
            ...prev,
            [qIndex]: { ...prev[qIndex], teacherFeedback: feedback }
        }));
    };

    const getOptionClass = (answer: QuizAnswer, optionIndex: number) => {
        const isStudentAnswer = optionIndex === Number(answer.studentAnswer);
        const isCorrectAnswer = optionIndex === answer.correctAnswer;
        if (isCorrectAnswer) return "border-green-500 bg-green-500/10";
        if (isStudentAnswer && !isCorrectAnswer) return "border-red-500 bg-red-500/10";
        return "";
    };

    return (
        <DialogContent className="max-w-4xl h-[90vh]">
            <DialogHeader>
                <DialogTitle>Submission from {submission.studentName}</DialogTitle>
                <DialogDescription>
                   Submitted on {submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}. 
                   Status: <Badge variant={submission.status === 'fully-graded' ? "default" : submission.status === 'pending-review' ? "secondary" : "outline"} className="capitalize">{submission.status.replace('-', ' ')}</Badge>
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-full pr-4">
            <div className="space-y-6 py-4">
                {quiz.questions.map((question, qIndex) => {
                    const answer = submission.answers.find(a => a.question === question.question);
                    if (!answer) return null;

                    return (
                        <Card key={qIndex} className="break-inside-avoid">
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
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-semibold text-sm mb-2">Student's Answer:</p>
                                            <p className="text-muted-foreground p-3 bg-secondary rounded-md whitespace-pre-wrap">{String(answer.studentAnswer)}</p>
                                        </div>

                                        {isGradingMode ? (
                                            <div className="p-3 border rounded-md bg-background space-y-3">
                                                <RadioGroup onValueChange={(val) => handleGradeChange(qIndex, val === 'correct')}>
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="correct" id={`grade-${qIndex}-correct`} />
                                                            <Label htmlFor={`grade-${qIndex}-correct`}>Correct</Label>
                                                        </div>
                                                         <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="incorrect" id={`grade-${qIndex}-incorrect`} />
                                                            <Label htmlFor={`grade-${qIndex}-incorrect`}>Incorrect</Label>
                                                        </div>
                                                    </div>
                                                </RadioGroup>
                                                <Textarea placeholder="Provide feedback (optional)" onChange={(e) => handleFeedbackChange(qIndex, e.target.value)} />
                                            </div>
                                        ) : submission.status !== 'pending-review' && (
                                            <div className="p-3 rounded-md border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {answer.isCorrect ? <CheckCircle className="h-5 w-5 text-green-500"/> : <XCircle className="h-5 w-5 text-red-500"/>}
                                                    <p className="font-semibold">{answer.isCorrect ? "Correct" : "Incorrect"}</p>
                                                </div>
                                                {answer.teacherFeedback && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{answer.teacherFeedback}</p>}
                                            </div>
                                        )}
                                        {submission.status === 'pending-review' && !isGradingMode && (
                                            <div className="mt-4 p-3 rounded-md border flex items-center gap-2 text-sm text-muted-foreground">
                                                <HelpCircle className="h-4 w-4"/>
                                                <span>This answer is pending review.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
                {isGradingMode && (
                    <Button onClick={() => onGrade(manualGrades)} className="w-full">Save Grades</Button>
                )}
            </div>
            </ScrollArea>
        </DialogContent>
    )
};


export default function AdminQuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const classroomId = params.classroomId as string;
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'ADMIN') return;

    if (!classroomId || !quizId) {
        router.push('/dashboard/admin');
        return;
    }

    const fetchQuiz = async () => {
        try {
            const quizDocRef = doc(db, `classrooms/${classroomId}/quizzes`, quizId);
            const quizDoc = await getDoc(quizDocRef);
            if (quizDoc.exists()) {
                 setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Quiz not found.' });
                router.push(`/dashboard/admin/classroom/${classroomId}`);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load quiz data.' });
        }
    };
    
    fetchQuiz();

    const submissionsQuery = query(collection(db, `classrooms/${classroomId}/quizzes/${quizId}/submissions`), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
        const fetchedSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizSubmission));
        setSubmissions(fetchedSubmissions);
        setLoading(false);
    }, (error) => {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch submissions.' });
        setLoading(false);
    });

    return () => unsubscribe();

  }, [classroomId, quizId, user, authLoading, router, toast]);

  const handleGradeSubmission = async (submission: QuizSubmission, grades: ManualGradeState) => {
    if (!quiz) return;
    try {
        let manuallyCorrectedCount = 0;
        const newAnswers = submission.answers.map((answer, index) => {
            if (answer.questionType === 'typed-answer' && grades[index]) {
                const gradedAnswer = { ...answer, ...grades[index] };
                if (gradedAnswer.isCorrect) manuallyCorrectedCount++;
                return gradedAnswer;
            }
            return answer;
        });
        
        const autoCorrectedCount = submission.answers.filter(a => a.questionType === 'multiple-choice' && a.isCorrect).length;
        const newTotalCorrect = autoCorrectedCount + manuallyCorrectedCount;
        const newScore = (newTotalCorrect / quiz.questions.length) * 100;

        const submissionDocRef = doc(db, `classrooms/${classroomId}/quizzes/${quizId}/submissions`, submission.id);
        await updateDoc(submissionDocRef, {
            answers: newAnswers,
            score: newScore,
            status: 'fully-graded',
        });

        toast({ title: "Grades Saved", description: `Final score for ${submission.studentName} is ${newScore.toFixed(0)}%.` });

    } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to save grades." });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container flex items-center justify-center h-screen">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) return null;

  const averageScore = submissions.length > 0
    ? submissions.reduce((acc, sub) => acc + sub.score, 0) / submissions.length
    : 0;

  const getStatusBadge = (status: QuizSubmission['status']) => {
    switch (status) {
        case 'fully-graded': return <Badge className="bg-green-500 hover:bg-green-600">Graded</Badge>;
        case 'pending-review': return <Badge variant="secondary">Pending Review</Badge>;
        case 'auto-graded': return <Badge variant="outline">Auto-Graded</Badge>;
        default: return <Badge variant="outline" className="capitalize">{status.replace('-', ' ')}</Badge>;
    }
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href={`/dashboard/admin/classroom/${classroomId}?tab=quizzes`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classroom
        </Link>
      </Button>

      <main className="space-y-6">
        <div>
            <p className="text-sm font-medium text-primary">Quiz Results</p>
            <h1 className="text-3xl md:text-4xl font-bold">{quiz.title}</h1>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Quiz Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                    <p className="text-2xl font-bold">{submissions.length}</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
                <CardDescription>
                    {submissions.length} student(s) have completed this quiz.
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
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right"><Percent className="inline-block h-4 w-4 mr-2" />Score</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.map(submission => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">{submission.studentName}</TableCell>
                                        <TableCell>{submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}</TableCell>
                                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                                        <TableCell className="text-right font-semibold">{submission.score.toFixed(0)}%</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild><Button variant="outline" size="sm">{submission.status === 'pending-review' ? 'Grade' : 'View'}</Button></DialogTrigger>
                                                <QuizReviewAndGrade quiz={quiz} submission={submission} onGrade={(grades) => handleGradeSubmission(submission, grades)} />
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
