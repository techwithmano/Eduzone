
"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { type Classroom, type Announcement, type Assignment } from '@/lib/types';
import { format } from "date-fns";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Megaphone, FileText, Plus, CalendarIcon, Settings, Users } from 'lucide-react';
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

const announcementSchema = z.object({
  content: z.string().min(10, "Announcement must be at least 10 characters.").max(1000, "Announcement cannot exceed 1000 characters."),
});

const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title cannot exceed 100 characters."),
  description: z.string().max(5000, "Description cannot exceed 5000 characters.").optional(),
  dueDate: z.date({ required_error: "A due date is required."}),
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
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const announcementForm = useForm<z.infer<typeof announcementSchema>>({ resolver: zodResolver(announcementSchema), defaultValues: { content: "" } });
  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({ resolver: zodResolver(assignmentSchema) });

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
                setClassroom({ id: classroomDoc.id, ...classroomDoc.data() } as Classroom);
            } else {
                toast({ variant: "destructive", title: "Access Denied", description: "Classroom not found or you are not the owner." });
                router.push('/dashboard/teacher');
                return;
            }
        } catch (error) {
            console.error("Error fetching classroom: ", error);
            router.push('/dashboard/teacher');
            return;
        } finally {
            setLoading(false);
        }
    }
    getPageData();
    
    const announcementsQuery = query(collection(db, `classrooms/${classroomId}/announcements`), orderBy('createdAt', 'desc'));
    const announcementsUnsub = onSnapshot(announcementsQuery, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });
    unsubscribers.push(announcementsUnsub);

    const assignmentsQuery = query(collection(db, `classrooms/${classroomId}/assignments`), orderBy('createdAt', 'desc'));
    const assignmentsUnsub = onSnapshot(assignmentsQuery, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment)));
    });
    unsubscribers.push(assignmentsUnsub);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };

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

      <div className="mb-6">
        <Badge variant="secondary" className="mb-2">{classroom.subject}</Badge>
        <h1 className="text-3xl md:text-4xl font-bold">{classroom.title}</h1>
      </div>

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="announcements"><Megaphone className="mr-2 h-4 w-4" />Announcements</TabsTrigger>
          <TabsTrigger value="assignments"><FileText className="mr-2 h-4 w-4" />Assignments</TabsTrigger>
          <TabsTrigger value="students" onClick={() => router.push(`/dashboard/teacher/enrollments/${classroomId}`)}><Users className="mr-2 h-4 w-4" />Students</TabsTrigger>
          <TabsTrigger value="settings" onClick={() => router.push(`/dashboard/teacher/edit/${classroomId}`)}><Settings className="mr-2 h-4 w-4" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Post an Announcement</CardTitle>
              <CardDescription>Share updates, reminders, or messages with your class.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...announcementForm}>
                <form onSubmit={announcementForm.handleSubmit(handleCreateAnnouncement)} className="space-y-4">
                  <FormField
                    control={announcementForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="What's on your mind?" className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
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
                          <FormField control={assignmentForm.control} name="title" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                                  <FormMessage />
                              </FormItem>
                          )} />
                          <FormField control={assignmentForm.control} name="description" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Description (optional)</FormLabel>
                                  <FormControl><Textarea {...field} /></FormControl>
                                  <FormMessage />
                              </FormItem>
                          )} />
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
        <TabsContent value="students"></TabsContent>
        <TabsContent value="settings"></TabsContent>
      </Tabs>
    </div>
  );
}
