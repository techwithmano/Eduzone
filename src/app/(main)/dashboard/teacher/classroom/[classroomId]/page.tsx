
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import {
  doc, getDoc, collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, deleteDoc, Unsubscribe, updateDoc,
  where, getDocs, writeBatch, arrayUnion, arrayRemove, documentId, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { type Classroom, type Announcement, type Assignment, type UserProfile, type Material, type Quiz, type QuizQuestion } from '@/lib/types';
import { format } from "date-fns";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Megaphone, FileText, Plus, CalendarIcon, Settings, Users, Trash2, Notebook, BookOpen, X } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';

const announcementSchema = z.object({
  content: z.string().min(10, "Announcement must be at least 10 characters.").max(1000, "Announcement cannot exceed 1000 characters."),
});

const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title cannot exceed 100 characters."),
  description: z.string().max(5000, "Description cannot exceed 5000 characters.").optional(),
  dueDate: z.date({ required_error: "A due date is required."}),
});

const materialSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().max(5000).optional(),
  link: z.string().url("Please enter a valid URL."),
});

const quizQuestionSchema = z.object({
    id: z.string(),
    question: z.string().min(5, "Question must be at least 5 characters."),
    options: z.array(z.string().min(1, "Option cannot be empty.")).length(4, "Please provide 4 options."),
    correctAnswer: z.coerce.number().min(0).max(3),
});
const quizSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters.").max(100),
    description: z.string().max(5000).optional(),
    questions: z.array(quizQuestionSchema).min(1, "Please add at least one question."),
});

const editClassroomSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  subject: z.string({ required_error: "Please select a subject."}).min(1, "Please select a subject."),
});

const subjects = ["Math", "Programming", "History", "Science", "English", "Art", "Music"];
type EnrolledStudent = Pick<UserProfile, 'uid' | 'displayName' | 'email'> & { id: string };
const addStudentSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
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
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null);

  const announcementForm = useForm<z.infer<typeof announcementSchema>>({ resolver: zodResolver(announcementSchema), defaultValues: { content: "" } });
  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({ resolver: zodResolver(assignmentSchema) });
  const materialForm = useForm<z.infer<typeof materialSchema>>({ resolver: zodResolver(materialSchema) });
  const quizForm = useForm<z.infer<typeof quizSchema>>({ resolver: zodResolver(quizSchema), defaultValues: { title: "", description: "", questions: [] }});
  const { fields: quizQuestions, append: appendQuizQuestion, remove: removeQuizQuestion } = useFieldArray({ control: quizForm.control, name: "questions" });
  
  const editClassroomForm = useForm<z.infer<typeof editClassroomSchema>>({ resolver: zodResolver(editClassroomSchema) });
  const addStudentForm = useForm<z.infer<typeof addStudentSchema>>({ resolver: zodResolver(addStudentSchema), defaultValues: { email: "" } });

  const simpleCreate = (collectionName: string) => async (data: any) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `classrooms/${classroomId}/${collectionName}`), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({ title: `${collectionName.slice(0, -1)} created!` });
      return true;
    } catch (error) {
      console.error(`Error creating ${collectionName}:`, error);
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
        console.error(`Error deleting ${collectionName}:`, error);
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

  const onAssignmentSubmit = async (values: z.infer<typeof assignmentSchema>) => {
    const success = await handleCreateAssignment(values);
    if (success) {
      assignmentForm.reset();
      setIsAssignmentDialogOpen(false);
    }
  };
  const onMaterialSubmit = async (values: z.infer<typeof materialSchema>) => {
    const success = await handleCreateMaterial(values);
    if (success) {
      materialForm.reset();
      setIsMaterialDialogOpen(false);
    }
  };
   const onQuizSubmit = async (values: z.infer<typeof quizSchema>) => {
    const success = await handleCreateQuiz(values);
    if (success) {
      quizForm.reset();
      setIsQuizDialogOpen(false);
    }
  };
  
  // Student Management
  const fetchEnrolledStudents = useCallback(async (studentIds: string[]) => {
      if (studentIds.length > 0) {
        // Use documentId() with 'in' query for efficiency, max 30 IDs per query in Firestore
        const chunks = [];
        for (let i = 0; i < studentIds.length; i += 30) {
            chunks.push(studentIds.slice(i, i + 30));
        }
        
        const studentPromises = chunks.map(chunk => {
            const studentsQuery = query(collection(db, "users"), where(documentId(), "in", chunk));
            return getDocs(studentsQuery);
        });
        
        const studentSnapshots = await Promise.all(studentPromises);
        const fetchedStudents = studentSnapshots.flatMap(snapshot => 
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrolledStudent))
        );
        
        setEnrolledStudents(fetchedStudents);
      } else {
        setEnrolledStudents([]);
      }
  }, []);

  const handleAddStudent = async (values: z.infer<typeof addStudentSchema>) => {
    setIsSubmitting(true);
    try {
      const usersQuery = query(collection(db, "users"), where("email", "==", values.email), limit(1));
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) {
        throw new Error("No user exists with this email address.");
      }
      
      const studentDoc = userSnapshot.docs[0];
      const studentData = studentDoc.data();
      
      if (studentData.role !== 'STUDENT') {
        throw new Error("This user is not registered as a student.");
      }

      if (classroom?.enrolledStudentIds?.includes(studentDoc.id)) {
        throw new Error("This student is already enrolled.");
      }

      const batch = writeBatch(db);
      const classroomDocRef = doc(db, "classrooms", classroomId);
      batch.update(classroomDocRef, { enrolledStudentIds: arrayUnion(studentDoc.id) });
      const studentDocRef = doc(db, "users", studentDoc.id);
      batch.update(studentDocRef, { enrolledClassroomIds: arrayUnion(classroomId) });
      await batch.commit();
      
      setEnrolledStudents(prev => [...prev, { id: studentDoc.id, ...studentData } as EnrolledStudent]);
      setClassroom(prev => prev ? ({ ...prev, enrolledStudentIds: [...(prev.enrolledStudentIds || []), studentDoc.id]}) : null);
      addStudentForm.reset();
      toast({ title: "Student Enrolled!", description: `${studentData.displayName} has been added.`});

    } catch (error: any) {
      toast({ variant: "destructive", title: "Enrollment Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRemoveClick = (student: EnrolledStudent) => setStudentToRemove(student);
  const handleRemoveConfirm = async () => {
    if (!studentToRemove) return;
    try {
        const batch = writeBatch(db);
        const classroomDocRef = doc(db, "classrooms", classroomId);
        batch.update(classroomDocRef, { enrolledStudentIds: arrayRemove(studentToRemove.id) });
        const studentDocRef = doc(db, "users", studentToRemove.id);
        batch.update(studentDocRef, { enrolledClassroomIds: arrayRemove(classroomId) });
        await batch.commit();

        setEnrolledStudents(currentStudents => currentStudents.filter(s => s.id !== studentToRemove!.id));
        setClassroom(prev => prev ? ({ ...prev, enrolledStudentIds: prev.enrolledStudentIds.filter(id => id !== studentToRemove.id) }) : null);
        toast({ title: "Student Removed", description: `"${studentToRemove.displayName}" has been removed.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Removal Failed" });
    } finally {
        setStudentToRemove(null);
    }
  };

  // Settings
  const handleUpdateClassroom = async (values: z.infer<typeof editClassroomSchema>) => {
    setIsSubmitting(true);
    try {
        const classroomDocRef = doc(db, "classrooms", classroomId);
        await updateDoc(classroomDocRef, values);
        setClassroom(prev => prev ? { ...prev, ...values } : null);
        toast({ title: "Classroom Updated!", description: "Your classroom has been successfully updated." });
    } catch(error) {
        toast({ variant: "destructive", title: "Update Failed", description: "There was a problem updating your classroom." });
    } finally {
        setIsSubmitting(false);
    }
  };

  // Initial Data Loading
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

            if (classroomDoc.exists() && classroomDoc.data().creatorId === user.uid) {
                const classroomData = { id: classroomDoc.id, ...classroomDoc.data() } as Classroom;
                setClassroom(classroomData);
                editClassroomForm.reset(classroomData);
                if (classroomData.enrolledStudentIds && classroomData.enrolledStudentIds.length > 0) {
                    await fetchEnrolledStudents(classroomData.enrolledStudentIds);
                }

                // Setup listeners
                const collectionsToListen = {
                    announcements: setAnnouncements,
                    assignments: setAssignments,
                    materials: setMaterials,
                    quizzes: setQuizzes,
                };

                Object.entries(collectionsToListen).forEach(([name, setter]) => {
                    const q = query(collection(db, `classrooms/${classroomId}/${name}`), orderBy('createdAt', 'desc'));
                    const unsub = onSnapshot(q, (snapshot) => {
                        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
                    });
                    unsubscribers.push(unsub);
                });

            } else {
                toast({ variant: "destructive", title: "Access Denied", description: "Classroom not found or you are not the owner." });
                router.push('/dashboard/teacher');
            }
        } catch (error) {
            console.error("Error fetching classroom: ", error);
            router.push('/dashboard/teacher');
        } finally {
            setLoading(false);
        }
    }
    getPageData();
    
    return () => unsubscribers.forEach(unsub => unsub());

  }, [classroomId, user, authLoading, router, toast, editClassroomForm, fetchEnrolledStudents]);

  if (loading || authLoading) {
    return <div className="container flex items-center justify-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  if (!classroom) return null;

  return (
    <>
      <AlertDialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{studentToRemove?.displayName}" from the classroom. They will lose access to all classroom materials. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-6 -ml-4">
          <Link href="/dashboard/teacher">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="mb-6">
          <Badge variant="secondary" className="mb-2">{classroom.subject}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-headline">{classroom.title}</h1>
        </div>

        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6">
            <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4" />Announcements</TabsTrigger>
            <TabsTrigger value="assignments"><FileText className="mr-2 h-4 w-4" />Assignments</TabsTrigger>
            <TabsTrigger value="quizzes"><Notebook className="mr-2 h-4 w-4" />Quizzes</TabsTrigger>
            <TabsTrigger value="materials"><BookOpen className="mr-2 h-4 w-4" />Materials</TabsTrigger>
            <TabsTrigger value="students"><Users className="mr-2 h-4 w-4" />Students</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Settings</TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Post an Announcement</CardTitle>
                <CardDescription>Share updates, reminders, or messages with your class.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...announcementForm}>
                  <form onSubmit={announcementForm.handleSubmit(handleCreateAnnouncement)} className="space-y-4">
                    <FormField control={announcementForm.control} name="content" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="What's on your mind?" className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post Announcement
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardHeader>
                  <CardTitle>Posted Announcements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {announcements.length > 0 ? (
                  announcements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} onDelete={() => handleDeleteAnnouncement(announcement.id)} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No announcements yet. Post one above!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Assignments</CardTitle>
                    <CardDescription>Manage homework, projects, and other assignments.</CardDescription>
                  </div>
                  <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Create Assignment</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>New Assignment</DialogTitle>
                        <DialogDescription>Fill in the details for the new assignment.</DialogDescription>
                      </DialogHeader>
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
                                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
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
                              <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Create
                              </Button>
                            </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignments.length > 0 ? (
                  assignments.map(assignment => (
                    <AssignmentCard key={assignment.id} classroomId={classroomId} assignment={assignment} isTeacher onDelete={() => handleDeleteAssignment(assignment.id)} />
                  ))
                ) : (
                   <div className="text-center py-10">
                      <p className="text-muted-foreground">No assignments created yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
           {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Quizzes</CardTitle>
                    <CardDescription>Create and manage quizzes for your students.</CardDescription>
                  </div>
                  <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Create Quiz</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>New Quiz</DialogTitle>
                        <DialogDescription>Build a new quiz for your students.</DialogDescription>
                      </DialogHeader>
                      <Form {...quizForm}>
                        <form onSubmit={quizForm.handleSubmit(onQuizSubmit)} className="space-y-6">
                            <ScrollArea className="h-[60vh] p-4">
                                <div className="space-y-4">
                                  <FormField control={quizForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Quiz Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                  <FormField control={quizForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                                  
                                  <Separator />
                                  
                                  <div>
                                      {quizQuestions.map((field, index) => (
                                          <Card key={field.id} className="mb-4">
                                              <CardHeader>
                                                  <div className="flex justify-between items-center">
                                                      <CardTitle>Question {index + 1}</CardTitle>
                                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeQuizQuestion(index)}>
                                                          <X className="h-4 w-4" />
                                                      </Button>
                                                  </div>
                                              </CardHeader>
                                              <CardContent className="space-y-4">
                                                  <FormField control={quizForm.control} name={`questions.${index}.question`} render={({ field }) => ( <FormItem><FormLabel>Question Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                  <div className="grid grid-cols-2 gap-4">
                                                      {[0, 1, 2, 3].map(optionIndex => (
                                                          <FormField key={optionIndex} control={quizForm.control} name={`questions.${index}.options.${optionIndex}`} render={({ field }) => ( <FormItem><FormLabel>Option {optionIndex + 1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                      ))}
                                                  </div>
                                                  <FormField control={quizForm.control} name={`questions.${index}.correctAnswer`} render={({ field }) => (
                                                      <FormItem>
                                                          <FormLabel>Correct Answer</FormLabel>
                                                          <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                                              <FormControl><SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger></FormControl>
                                                              <SelectContent>
                                                                  <SelectItem value="0">Option 1</SelectItem>
                                                                  <SelectItem value="1">Option 2</SelectItem>
                                                                  <SelectItem value="2">Option 3</SelectItem>
                                                                  <SelectItem value="3">Option 4</SelectItem>
                                                              </SelectContent>
                                                          </Select>
                                                          <FormMessage />
                                                      </FormItem>
                                                  )}/>
                                              </CardContent>
                                          </Card>
                                      ))}
                                  </div>
                                  <Button type="button" variant="outline" onClick={() => appendQuizQuestion({ id: uuidv4(), question: '', options: ['', '', '', ''], correctAnswer: 0})}>
                                      <Plus className="mr-2 h-4 w-4" />Add Question
                                  </Button>
                                </div>
                            </ScrollArea>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Quiz
                                </Button>
                            </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {quizzes.length > 0 ? (
                  quizzes.map(quiz => (
                    <QuizCard key={quiz.id} classroomId={classroomId} quiz={quiz} isTeacher onDelete={() => handleDeleteQuiz(quiz.id)} />
                  ))
                ) : (
                   <div className="text-center py-10"><p className="text-muted-foreground">No quizzes created yet.</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
             <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Course Materials</CardTitle>
                    <CardDescription>Share links to articles, videos, and documents.</CardDescription>
                  </div>
                  <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" />Add Material</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>New Material</DialogTitle>
                        <DialogDescription>Add a new resource for your students.</DialogDescription>
                      </DialogHeader>
                      <Form {...materialForm}>
                        <form onSubmit={materialForm.handleSubmit(onMaterialSubmit)} className="grid gap-4 py-4">
                            <FormField control={materialForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={materialForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={materialForm.control} name="link" render={({ field }) => ( <FormItem><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <DialogFooter>
                              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                              <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Add
                              </Button>
                            </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {materials.length > 0 ? (
                  materials.map(material => (
                    <MaterialCard key={material.id} material={material} isTeacher onDelete={() => handleDeleteMaterial(material.id)} />
                  ))
                ) : (
                   <div className="text-center py-10"><p className="text-muted-foreground">No materials posted yet.</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Student</CardTitle>
                            <CardDescription>Enter the email of the student you want to enroll.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...addStudentForm}>
                                <form onSubmit={addStudentForm.handleSubmit(handleAddStudent)} className="space-y-4">
                                    <FormField control={addStudentForm.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Student Email</FormLabel>
                                            <FormControl><Input placeholder="student@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                                        Enroll Student
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enrolled Students</CardTitle>
                            <CardDescription>
                              {enrolledStudents.length} student(s) enrolled.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {enrolledStudents.length > 0 ? (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="hidden sm:table-cell">Email</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {enrolledStudents.map((student) => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="font-medium">{student.displayName}</TableCell>
                                                    <TableCell className="hidden sm:table-cell">{student.email}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveClick(student)} title="Remove Student">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                            <span className="sr-only">Remove</span>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    No students are enrolled in this classroom yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
                <CardHeader>
                    <CardTitle>Classroom Settings</CardTitle>
                    <CardDescription>Update the details for your classroom.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...editClassroomForm}>
                        <form onSubmit={editClassroomForm.handleSubmit(handleUpdateClassroom)} className="space-y-6">
                            <FormField control={editClassroomForm.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Classroom Title</FormLabel>
                                    <FormControl><Input placeholder="e.g., Grade 10 Algebra" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={editClassroomForm.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea placeholder="Describe the classroom in detail..." className="min-h-[120px] resize-y" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={editClassroomForm.control} name="subject" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
