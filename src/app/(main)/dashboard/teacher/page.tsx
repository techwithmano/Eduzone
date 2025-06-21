
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { type Course } from "@/components/product-card";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Loader2, Edit, Trash2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";


type TeacherCourse = Course & { creatorName?: string };

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<TeacherCourse | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (user.role !== "TEACHER") {
      router.push("/dashboard");
      return;
    }

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "products"), where("creatorId", "==", user.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const userCourses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherCourse[];
        setCourses(userCourses);
      } catch (error) {
        console.error("Error fetching user courses: ", error);
        toast({ variant: "destructive", title: "Error fetching courses", description: "There was an issue retrieving your courses. Please try refreshing the page."})
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user, authLoading, router, toast]);

  const handleDeleteClick = (course: TeacherCourse) => {
    setCourseToDelete(course);
    setIsAlertOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
        await deleteDoc(doc(db, "products", courseToDelete.id));
        setCourses(courses.filter(p => p.id !== courseToDelete.id));
        toast({
            title: "Course Deleted",
            description: `"${courseToDelete.title}" has been successfully deleted.`,
        });
    } catch (error) {
        console.error("Error deleting course: ", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "There was a problem deleting the course. Please try again.",
        });
    } finally {
        setIsAlertOpen(false);
        setCourseToDelete(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'TEACHER') {
    return null;
  }

  return (
    <>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            course "{courseToDelete?.title}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setCourseToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
            Teacher Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your courses and educational content here.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
          <CardDescription>A list of all the courses you have created.</CardDescription>
        </CardHeader>
        <CardContent>
            {courses.length > 0 ? (
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{course.category}</Badge></TableCell>
                          <TableCell className="text-right hidden md:table-cell">${course.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" asChild title="Manage Students">
                                <Link href={`/dashboard/teacher/enrollments/${course.id}`}>
                                    <Users className="h-4 w-4" />
                                    <span className="sr-only">Manage Students</span>
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild title="Edit Course">
                                  <Link href={`/dashboard/teacher/edit/${course.id}`}>
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">Edit Course</span>
                                  </Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(course)} title="Delete Course">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete Course</span>
                              </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
             </div>
          ) : (
            <div className="text-center py-16">
                <h3 className="text-lg font-semibold">No courses yet!</h3>
                <p className="text-muted-foreground mt-2">Click the button above to create your first course.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
