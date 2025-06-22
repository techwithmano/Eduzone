
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import {
  doc, getDoc, collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, deleteDoc, Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { type Classroom, type Announcement, type Assignment, type Material, type Quiz, type QuizQuestion } from '@/lib/types';
import { format } from "date-fns";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Megaphone, FileText, Plus, CalendarIcon, Notebook, BookOpen, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { AnnouncementCard } from '@/components/announcement-card';
import { AssignmentCard } from '@/components/assignment-card';
import { MaterialCard } from '@/components/material-card';
import { QuizCard } from '@/components/quiz-card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const announcementSchema = z.object({
  content: z.string().min(10).max(1000),
});
const assignmentSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(5000).optional(),
  dueDate: z.date(),
});
const materialSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(5000).optional(),
  link: z.string().url(),
});
const quizQuestionSchema = z.object({
    id: z.string(),
    question: z.string().min(5),
    options: z.array(z.string().min(1)).length(4),
    correctAnswer: z.coerce.number().min(0).max(3),
});
const quizSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(5000).optional(),
    questions: z.array(quizQuestionSchema).min(1),
});

export default function TeacherClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const classroomId = params.classroomId as string;
  const { toast } = useToast();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);

  const announcementForm = useForm<z.infer<typeof announcementSchema>>({ resolver: zodResolver(announcementSchema), defaultValues: { content: "" } });
  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({ resolver: zodResolver(assignmentSchema), defaultValues: { title: "", description: "" } });
  const materialForm = useForm<z.infer<typeof materialSchema>>({ resolver: zodResolver(materialSchema), defaultValues: { title: "", description: "", link: "" } });
  const quizForm = useForm<z.infer<typeof quizSchema>>({ resolver: zodResolver(quizSchema), defaultValues: { title: "", description: "", questions: [] }});
  const { fields: quizQuestions, append: appendQuizQuestion, remove: removeQuizQuestion } = useFieldArray({ control: quizForm.control, name: "questions" });

  const simpleCreate = (collectionName: string) => async (data: any) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `classrooms/${classroomId}/${collectionName}`), {
        ...data,
        authorId: user.uid,
        authorName: user.displayName,
        createdAt: serverTimestamp(),
      });
      toast({ title: `${collectionName.slice(0, -1)} created!` });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to create ${collectionName}.` });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const simpleDelete = (collectionName: string) => async (docId: string) => {
    try {
        await deleteDoc(doc(db, `classrooms/${classroomId}/${collectionName}`, docId));
        toast({ title: `${collectionName.slice(0,-1)} deleted.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: `Failed to delete.` });
    }
  };

  const handleCreateAnnouncement = simpleCreate('announcements');
  const handleDeleteAnnouncement = simpleDelete('announcements');
  const handleCreateAssignment = simpleCreate('assignments');
  const handleDeleteAssignment = simpleDelete('assignments');
  const handleCreateMaterial = simpleCreate('materials');
  const handleDeleteMaterial = simpleDelete('materials');
  const handleCreateQuiz = simpleCreate('quizzes');
  const handleDeleteQuiz = simpleDelete('quizzes');

  const onAnnouncementSubmit = async (values: z.infer<typeof announcementSchema>) => {
    if(await handleCreateAnnouncement(values)) announcementForm.reset();
  }
  const onAssignmentSubmit = async (values: z.infer<typeof assignmentSchema>) => {
    if (await handleCreateAssignment(values)) { assignmentForm.reset(); setIsAssignmentDialogOpen(false); }
  };
  const onMaterialSubmit = async (values: z.infer<typeof materialSchema>) => {
    if (await handleCreateMaterial(values)) { materialForm.reset(); setIsMaterialDialogOpen(false); }
  };
   const onQuizSubmit = async (values: z.infer<typeof quizSchema>) => {
    if (await handleCreateQuiz(values)) { quizForm.reset(); setIsQuizDialogOpen(false); }
  };
  
  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'TEACHER') {
      router.push('/auth');
      return;
    }
    if (!classroomId) {
      router.push('/dashboard/teacher');
      return;
    }

    let unsubscribers: Unsubscribe[] = [];
    const getPageData = async () => {
        setLoading(true);
        try {
            const classroomDocRef = doc(db, "classrooms", classroomId);
            const classroomDoc = await getDoc(classroomDocRef);

            if (classroomDoc.exists() && classroomDoc.data().teacherIds?.includes(user.uid)) {
                setClassroom({ ...classroomDoc.data(), id: classroomDoc.id } as Classroom);

                Object.entries({ announcements: setAnnouncements, assignments: setAssignments, materials: setMaterials, quizzes: setQuizzes })
                    .forEach(([name, setter]) => {
                        const q = query(collection(db, `classrooms/${classroomId}/${name}`), orderBy('createdAt', 'desc'));
                        const unsub = onSnapshot(q, (snapshot) => setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any));
                        unsubscribers.push(unsub);
                    });
            } else {
                toast({ variant: "destructive", title: "Access Denied", description: "You are not assigned to this classroom." });
                router.push('/dashboard/teacher');
            }
        } catch (error) {
            router.push('/dashboard/teacher');
        } finally {
            setLoading(false);
        }
    }
    getPageData();
    
    return () => unsubscribers.forEach(unsub => unsub());

  }, [classroomId, user, authLoading, router, toast]);

  if (loading || authLoading) {
    return <div className="container flex items-center justify-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  if (!classroom) return null;

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href="/dashboard/teacher">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="mb-8">
        <Badge variant="secondary" className="mb-2">{classroom.subject}</Badge>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">{classroom.title}</h1>
        <p className="text-muted-foreground mt-1">Admin: {classroom.creatorName}</p>
      </div>

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4" />Announcements</TabsTrigger>
          <TabsTrigger value="assignments"><FileText className="mr-2 h-4 w-4" />Assignments</TabsTrigger>
          <TabsTrigger value="quizzes"><Notebook className="mr-2 h-4 w-4" />Quizzes</TabsTrigger>
          <TabsTrigger value="materials"><BookOpen className="mr-2 h-4 w-4" />Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Post an Announcement</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...announcementForm}>
                <form onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)} className="space-y-4">
                  <FormField control={announcementForm.control} name="content" render={({ field }) => (
                    <FormItem>
                      <FormControl><Textarea placeholder="What's on your mind?" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardHeader><CardTitle>Posted Announcements</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {announcements.length > 0 ? announcements.map(announcement => (
                <AnnouncementCard key={announcement.id} announcement={announcement} onDelete={() => handleDeleteAnnouncement(announcement.id)} />
              )) : <p className="text-muted-foreground text-center py-4">No announcements yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <CardTitle>Assignments</CardTitle>
                  <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Assignment</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
                      <Form {...assignmentForm}>
                        <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="grid gap-4 py-4">
                            <FormField control={assignmentForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={assignmentForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={assignmentForm.control} name="dueDate" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Due Date</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button variant={"outline"} className={cn(!field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
                            </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignments.length > 0 ? assignments.map(assignment => (
                  <AssignmentCard key={assignment.id} classroomId={classroomId} assignment={assignment} isTeacher onDelete={() => handleDeleteAssignment(assignment.id)} />
                )) : <div className="text-center py-10"><p className="text-muted-foreground">No assignments created.</p></div>}
              </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <CardTitle>Quizzes</CardTitle>
                  <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Quiz</Button></DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader><DialogTitle>New Quiz</DialogTitle></DialogHeader>
                      <Form {...quizForm}>
                        <form onSubmit={quizForm.handleSubmit(onQuizSubmit)} className="space-y-6">
                            <ScrollArea className="h-[60vh] p-4">
                                <div className="space-y-4">
                                  <FormField control={quizForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Quiz Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                  <FormField control={quizForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                                  <Separator />
                                  {quizQuestions.map((field, index) => (
                                      <Card key={field.id} className="mb-4">
                                          <CardHeader><div className="flex justify-between items-center"><CardTitle>Question {index + 1}</CardTitle><Button type="button" variant="ghost" size="icon" onClick={() => removeQuizQuestion(index)}><X className="h-4 w-4" /></Button></div></CardHeader>
                                          <CardContent className="space-y-4">
                                              <FormField control={quizForm.control} name={`questions.${index}.question`} render={({ field }) => ( <FormItem><FormLabel>Question Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                              <div className="grid grid-cols-2 gap-4">
                                                  {[0, 1, 2, 3].map(optionIndex => (<FormField key={optionIndex} control={quizForm.control} name={`questions.${index}.options.${optionIndex}`} render={({ field }) => ( <FormItem><FormLabel>Option {optionIndex + 1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />))}
                                              </div>
                                              <FormField control={quizForm.control} name={`questions.${index}.correctAnswer`} render={({ field }) => (<FormItem><FormLabel>Correct Answer</FormLabel><Select onValueChange={field.onChange} value={String(field.value)}><FormControl><SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger></FormControl><SelectContent><SelectItem value="0">Option 1</SelectItem><SelectItem value="1">Option 2</SelectItem><SelectItem value="2">Option 3</SelectItem><SelectItem value="3">Option 4</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                                          </CardContent>
                                      </Card>
                                  ))}
                                  <Button type="button" variant="outline" onClick={() => appendQuizQuestion({ id: uuidv4(), question: '', options: ['', '', '', ''], correctAnswer: 0})}><Plus className="mr-2 h-4 w-4" />Add Question</Button>
                                </div>
                            </ScrollArea>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Quiz</Button>
                            </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {quizzes.length > 0 ? quizzes.map(quiz => (
                    <QuizCard key={quiz.id} classroomId={classroomId} quiz={quiz} isTeacher onDelete={() => handleDeleteQuiz(quiz.id)} />
                )) : <div className="text-center py-10"><p className="text-muted-foreground">No quizzes created.</p></div>}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="materials">
           <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <CardTitle>Course Materials</CardTitle>
                <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
                  <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Material</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>New Material</DialogTitle></DialogHeader>
                    <Form {...materialForm}>
                      <form onSubmit={materialForm.handleSubmit(onMaterialSubmit)} className="grid gap-4 py-4">
                          <FormField control={materialForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={materialForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={materialForm.control} name="link" render={({ field }) => ( <FormItem><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button>
                          </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {materials.length > 0 ? materials.map(material => (
                <MaterialCard key={material.id} material={material} isTeacher onDelete={() => handleDeleteMaterial(material.id)} />
              )) : <div className="text-center py-10"><p className="text-muted-foreground">No materials posted.</p></div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
