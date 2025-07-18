
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, doc, writeBatch, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";


const classroomSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  subject: z.string({ required_error: "Please select a subject."}).min(1, "Please select a subject."),
  displayTeacherName: z.string().max(100, "Name is too long.").optional(),
});

const subjects = ["Math", "Programming", "History", "Science", "English", "Art", "Music"];

export default function CreateClassroomPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof classroomSchema>>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      displayTeacherName: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof classroomSchema>) => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to create a classroom." });
        return;
    }
    setLoading(true);
    try {
        const batch = writeBatch(db);
        const newClassroomRef = doc(collection(db, "classrooms"));
        
        const dataToSave: any = {
            ...values,
            id: newClassroomRef.id,
            imageUrl: `https://placehold.co/600x400.png?text=${values.subject.replace(' ', '+')}`,
            creatorId: user.uid,
            creatorName: user.displayName || "Anonymous",
            enrolledStudentIds: [],
            teacherIds: [],
            createdAt: serverTimestamp(),
        };

        if (!dataToSave.displayTeacherName) {
            delete dataToSave.displayTeacherName;
        }

        batch.set(newClassroomRef, dataToSave);
        
        const userDocRef = doc(db, "users", user.uid);
        batch.update(userDocRef, {
            createdClassroomIds: arrayUnion(newClassroomRef.id)
        });

        await batch.commit();

        toast({
          title: "Classroom Created!",
          description: "Your new classroom has been created.",
        })
        router.push("/dashboard/admin");
    } catch(error) {
        console.error("Error creating classroom: ", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem creating your classroom. Please try again.",
        })
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="container py-8">
        <div className="max-w-2xl mx-auto">
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href="/dashboard/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Admin Dashboard
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Classroom</CardTitle>
                    <CardDescription>Fill out the form below to set up your new classroom.</CardDescription>
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
                                    <FormControl><Textarea placeholder="e.g., A brief overview of the classroom..." className="min-h-[120px] resize-y" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="subject" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                             <FormField control={form.control} name="displayTeacherName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Displayed Teacher Name (Optional)</FormLabel>
                                    <FormControl><Input placeholder="e.g., Prof. John Doe" {...field} /></FormControl>
                                    <FormDescription>If you leave this blank, the names of assigned teachers will be shown automatically.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Classroom
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
