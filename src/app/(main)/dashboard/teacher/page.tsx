
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { type Classroom } from "@/components/classroom-card";

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


export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);

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

    const fetchClassrooms = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "classrooms"), where("creatorId", "==", user.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const userClassrooms = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Classroom[];
        setClassrooms(userClassrooms);
      } catch (error) {
        console.error("Error fetching user classrooms: ", error);
        toast({ variant: "destructive", title: "Error fetching classrooms", description: "There was an issue retrieving your classrooms. You may need to create a Firestore Index."})
      } finally {
        setLoading(false);
      }
    };
    fetchClassrooms();
  }, [user, authLoading, router, toast]);

  const handleDeleteClick = (classroom: Classroom) => {
    setClassroomToDelete(classroom);
    setIsAlertOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!classroomToDelete) return;

    try {
        await deleteDoc(doc(db, "classrooms", classroomToDelete.id));
        setClassrooms(classrooms.filter(p => p.id !== classroomToDelete.id));
        toast({
            title: "Classroom Deleted",
            description: `"${classroomToDelete.title}" has been successfully deleted.`,
        });
    } catch (error) {
        console.error("Error deleting classroom: ", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "There was a problem deleting the classroom. Please try again.",
        });
    } finally {
        setIsAlertOpen(false);
        setClassroomToDelete(null);
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
            classroom "{classroomToDelete?.title}" and all its contents.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setClassroomToDelete(null)}>Cancel</AlertDialogCancel>
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
            <p className="text-muted-foreground">Manage your classrooms here.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Classroom
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Classrooms</CardTitle>
          <CardDescription>A list of all the classrooms you have created.</CardDescription>
        </CardHeader>
        <CardContent>
            {classrooms.length > 0 ? (
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Subject</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {classrooms.map((classroom) => (
                        <TableRow key={classroom.id}>
                          <TableCell className="font-medium">{classroom.title}</TableCell>
                          <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{classroom.subject}</Badge></TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" asChild title="Manage Students">
                                <Link href={`/dashboard/teacher/enrollments/${classroom.id}`}>
                                    <Users className="h-4 w-4" />
                                    <span className="sr-only">Manage Students</span>
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild title="Edit Classroom">
                                  <Link href={`/dashboard/teacher/edit/${classroom.id}`}>
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">Edit Classroom</span>
                                  </Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(classroom)} title="Delete Classroom">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete Classroom</span>
                              </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
             </div>
          ) : (
            <div className="text-center py-16">
                <h3 className="text-lg font-semibold">No classrooms yet!</h3>
                <p className="text-muted-foreground mt-2">Click the button above to create your first classroom.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
