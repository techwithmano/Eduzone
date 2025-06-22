
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

import { type Classroom } from "@/components/classroom-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Trash2, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const addStudentSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type EnrolledStudent = {
  id: string; // This is the user's UID
  displayName: string;
  email: string;
};

export default function EnrollmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  // The slug is still called `courseId` from the folder name, but it's a classroom ID.
  const classroomId = params.courseId as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null);

  const form = useForm<z.infer<typeof addStudentSchema>>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (!classroomId) return;

    const fetchEnrollmentData = async () => {
      setLoading(true);
      try {
        // Fetch classroom details
        const classroomDocRef = doc(db, "classrooms", classroomId);
        const classroomDoc = await getDoc(classroomDocRef);
        if (!classroomDoc.exists()) {
          toast({ variant: "destructive", title: "Classroom not found" });
          router.push("/dashboard/teacher");
          return;
        }
        setClassroom({ id: classroomDoc.id, ...classroomDoc.data() } as Classroom);

        // Fetch enrolled students by querying the users collection
        const studentsQuery = query(collection(db, "users"), where("enrolledCourseIds", "array-contains", classroomId));
        const studentsSnapshot = await getDocs(studentsQuery);
        const fetchedStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EnrolledStudent[];
        setEnrolledStudents(fetchedStudents);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ variant: "destructive", title: "Failed to load data", description: "You may need to create a Firestore index. Check the browser console for a link." });
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentData();
  }, [classroomId, router, toast]);

  const handleAddStudent = async (values: z.infer<typeof addStudentSchema>) => {
    setSubmitting(true);
    try {
      const usersQuery = query(collection(db, "users"), where("email", "==", values.email));
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) {
        toast({ variant: "destructive", title: "Student not found", description: "No user exists with this email address." });
        return;
      }
      
      const studentDoc = userSnapshot.docs[0];
      const studentData = studentDoc.data();
      
      if (studentData.role !== 'STUDENT') {
        toast({ variant: "destructive", title: "Not a Student", description: "This user is not registered as a student." });
        return;
      }

      const isEnrolled = enrolledStudents.some(s => s.id === studentDoc.id);
      if (isEnrolled) {
        toast({ variant: "destructive", title: "Already Enrolled", description: "This student is already enrolled in this classroom." });
        return;
      }

      // Add the classroomId to the student's `enrolledCourseIds` array
      const studentDocRef = doc(db, "users", studentDoc.id);
      await updateDoc(studentDocRef, {
        enrolledCourseIds: arrayUnion(classroomId)
      });
      
      const newStudent: EnrolledStudent = {
        id: studentDoc.id,
        displayName: studentData.displayName,
        email: studentData.email
      };

      setEnrolledStudents([...enrolledStudents, newStudent]);
      form.reset();
      toast({ title: "Student Enrolled!", description: `${studentData.displayName} has been added to the classroom.`});

    } catch (error) {
      console.error("Error enrolling student:", error);
      toast({ variant: "destructive", title: "Enrollment failed", description: "An unexpected error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveClick = (student: EnrolledStudent) => {
    setStudentToRemove(student);
  };
  
  const handleRemoveConfirm = async () => {
    if (!studentToRemove) return;

    try {
        // Remove the classroomId from the student's `enrolledCourseIds` array
        const studentDocRef = doc(db, "users", studentToRemove.id);
        await updateDoc(studentDocRef, {
            enrolledCourseIds: arrayRemove(classroomId)
        });
        setEnrolledStudents(enrolledStudents.filter(s => s.id !== studentToRemove.id));
        toast({
            title: "Student Removed",
            description: `"${studentToRemove.displayName}" has been removed from the classroom.`,
        });
    } catch (error) {
        console.error("Error removing student: ", error);
        toast({
            variant: "destructive",
            title: "Removal Failed",
            description: "There was a problem removing the student.",
        });
    } finally {
        setStudentToRemove(null);
    }
  };

  if (loading) {
    return (
        <div className="container py-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                  <Skeleton className="h-48 w-full" />
              </div>
              <div className="lg:col-span-2">
                  <Skeleton className="h-64 w-full" />
              </div>
            </div>
        </div>
    )
  }

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
            <AlertDialogAction onClick={handleRemoveConfirm}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/dashboard/teacher">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teacher Dashboard
          </Link>
        </Button>
        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tighter font-headline">Manage Students</h1>
            <p className="text-muted-foreground">Classroom: <span className="font-semibold text-foreground">{classroom?.title}</span></p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Add Student</CardTitle>
                        <CardDescription>Enter the email of the student you want to enroll.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddStudent)} className="space-y-4">
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student Email</FormLabel>
                                        <FormControl><Input placeholder="student@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="submit" disabled={submitting} className="w-full">
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
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
                          {enrolledStudents.length > 0 
                            ? `There are ${enrolledStudents.length} student(s) enrolled in this classroom.`
                            : "No students are enrolled in this classroom yet."
                          }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {enrolledStudents.length > 0 ? (
                             <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {enrolledStudents.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.displayName}</TableCell>
                                                <TableCell>{student.email}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveClick(student)} title="Remove Student">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Remove</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">Use the form to add your first student.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </>
  );
}
