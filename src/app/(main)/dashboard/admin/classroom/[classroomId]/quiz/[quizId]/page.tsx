
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { format } from "date-fns";

import { type Quiz, type QuizSubmission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Calendar, Percent, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';

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
                                    <TableHead className="text-right"><Percent className="inline-block h-4 w-4 mr-2" />Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.map(submission => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">{submission.studentName}</TableCell>
                                        <TableCell>{submission.submittedAt ? format(submission.submittedAt.toDate(), 'PPP p') : 'N/A'}</TableCell>
                                        <TableCell className="text-right font-semibold">{submission.score.toFixed(0)}%</TableCell>
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
