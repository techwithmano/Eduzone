
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  doc, getDoc, collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, deleteDoc, Unsubscribe, updateDoc,
  where, getDocs, writeBatch, arrayUnion, arrayRemove, documentId, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { type Classroom, type Announcement, type Assignment, type UserProfile } from '@/lib/types';
import { format } from "date-fns";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Megaphone, FileText, Plus, CalendarIcon, Settings, Users, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { AnnouncementCard } from '@/components/announcement-card';
import { AssignmentCard } from '@/components/assignment-card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const announcementSchema = z.object({
  content: z.string().min(10, "Announcement must be at least 10 characters.").max(1000, "Announcement cannot exceed 1000 characters."),
});

const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title cannot exceed 100 characters."),
  description: z.string().max(5000, "Description cannot exceed 5000 characters.").optional(),
  dueDate: z.date({ required_error: "A due date is required."}),
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
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null);

  const announcementForm = useForm<z.infer<typeof announcementSchema>>({ resolver: zodResolver(announcementSchema), defaultValues: { content: "" } });
  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({ resolver: zodResolver(assignmentSchema) });
  const editClassroomForm = useForm<z.infer<typeof editClassroomSchema>>({ resolver: zodResolver(editClassroomSchema) });
  const addStudentForm = useForm<z.infer<typeof addStudentSchema>>({ resolver: zodResolver(addStudentSchema), defaultValues: { email: "" } });

  // Announcements
  const handleCreateAnnouncement = async (values: z.infer<typeof announcementSchema>) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `classrooms/${classroomId}/announcements`), {
        content: values.content,
        authorId: user.uid,
        authorName: user.displayName || 'Teacher',
        createdAt: serverTimestamp(),
      });
      announcementForm.reset({ content: "" });
      toast({ title: "Announcement posted!" });
    } catch (error) {
      console.error("Error posting announcement:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to post announcement." });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      await deleteDoc(doc(db, `classrooms/${classroomId}/announcements`, announcementId));
      toast({ title: "Announcement deleted." });
    } catch (error) {
       console.error("Error deleting announcement:", error);
       toast({ variant: "destructive", title: "Error", description: "Failed to delete announcement." });
    }
  }

  // Assignments
  const handleCreateAssignment = async (values: z.infer<typeof assignmentSchema>) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `classrooms/${classroomId}/assignments`), {
        ...values,
        createdAt: serverTimestamp(),
      });
      assignmentForm.reset();
      setIsAssignmentDialogOpen(false);
      toast({ title: "Assignment created!" });
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create assignment." });
    } finally {
      setIsSubmitting(false);
    }
  };
   const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteDoc(doc(db, `classrooms/${classroomId}/assignments`, assignmentId));
      toast({ title: "Assignment deleted." });
    } catch (error) {
       console.error("Error deleting assignment:", error);
       toast({ variant: "destructive", title: "Error", description: "Failed to delete assignment." });
    }
  }

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

    const classroomDocRef = doc(db, "classrooms", classroomId);
    let unsubscribers: Unsubscribe[] = [];

    const getPageData = async () => {
        setLoading(true);
        try {
            const classroomDoc = await getDoc(classroomDocRef);
            if (classroomDoc.exists() && classroomDoc.data().creatorId === user.uid) {
                const classroomData = { id: classroomDoc.id, ...classroomDoc.data() } as Classroom;
                setClassroom(classroomData);
                editClassroomForm.reset(classroomData);
                if (classroomData.enrolledStudentIds && classroomData.enrolledStudentIds.length > 0) {
                    await fetchEnrolledStudents(classroomData.enrolledStudentIds);
                }

                // Setup listeners after initial data load
                const announcementsQuery = query(collection(db, `classrooms/${classroomId}/announcements`), orderBy('createdAt', 'desc'));
                const unsubAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
                  setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
                });
                unsubscribers.push(unsubAnnouncements);

                const assignmentsQuery = query(collection(db, `classrooms/${classroomId}/assignments`), orderBy('createdAt', 'desc'));
                const unsubAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
                  setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment)));
                });
                unsubscribers.push(unsubAssignments);

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
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
            <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4" />Announcements</TabsTrigger>
            <TabsTrigger value="assignments"><FileText className="mr-2 h-4 w-4" />Assignments</TabsTrigger>
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
                        <form onSubmit={assignmentForm.handleSubmit(handleCreateAssignment)} className="grid gap-4 py-4">
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
