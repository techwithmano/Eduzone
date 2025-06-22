
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";


const classroomSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  subject: z.string({ required_error: "Please select a subject."}).min(1, "Please select a subject."),
});

const subjects = ["Math", "Programming", "History", "Science", "English", "Art", "Music"];

export default function EditClassroomPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const classroomId = params.classroomId as string;

  const form = useForm<z.infer<typeof classroomSchema>>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: undefined,
    },
  });
  
  useEffect(() => {
    if (!classroomId) {
        router.push('/dashboard/teacher');
        return;
    };
    if (!user) return;

    const fetchClassroomData = async () => {
      setLoading(true);
      try {
        const classroomDocRef = doc(db, "classrooms", classroomId);
        const classroomDoc = await getDoc(classroomDocRef);

        if (classroomDoc.exists()) {
          const classroomData = classroomDoc.data();
          // Security check
          if (classroomData.creatorId !== user.uid) {
            toast({ variant: "destructive", title: "Access Denied" });
            router.push("/dashboard/teacher");
            return;
          }
          form.reset(classroomData);
        } else {
          toast({ variant: "destructive", title: "Classroom not found" });
          router.push("/dashboard/teacher");
        }
      } catch (error) {
        console.error("Error fetching classroom data:", error);
        toast({ variant: "destructive", title: "Failed to load classroom data" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassroomData();
  }, [classroomId, form, router, toast, user]);

  const onSubmit = async (values: z.infer<typeof classroomSchema>) => {
    setSubmitting(true);
    try {
        const classroomDocRef = doc(db, "classrooms", classroomId);
        await updateDoc(classroomDocRef, values);
        toast({
          title: "Classroom Updated!",
          description: "Your classroom has been successfully updated.",
        })
        router.push(`/dashboard/teacher/classroom/${classroomId}`);
    } catch(error) {
        console.error("Error updating classroom: ", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem updating your classroom. Please try again.",
        })
    } finally {
        setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
           <Skeleton className="h-8 w-64 mb-4" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-8">
        <div className="max-w-2xl mx-auto">
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href={`/dashboard/teacher/classroom/${classroomId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Classroom
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Classroom</CardTitle>
                    <CardDescription>Update the details for your classroom.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Classroom Title</FormLabel>
                                    <FormControl><Input placeholder="e.g., Grade 10 Algebra" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea placeholder="Describe the classroom in detail..." className="min-h-[120px] resize-y" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="subject" render={({ field }) => (
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

                            <Button type="submit" disabled={submitting} className="w-full">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
