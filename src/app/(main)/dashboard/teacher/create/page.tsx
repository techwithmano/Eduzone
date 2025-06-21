"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";


const productSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  category: z.string({ required_error: "Please select a category."}).min(1, "Please select a category."),
  subject: z.string({ required_error: "Please select a subject."}).min(1, "Please select a subject."),
});

const categories = ["Course", "Notes", "Mock Exam", "Worksheet"];
const subjects = ["Math", "Programming", "History", "Science", "English"];

export default function CreateProductPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to create a product." });
        return;
    }
    setLoading(true);
    try {
        await addDoc(collection(db, "products"), {
            ...values,
            imageUrl: `https://placehold.co/600x400.png`,
            creatorId: user.uid,
            creatorName: user.displayName || "Anonymous",
            createdAt: serverTimestamp(),
        });
        toast({
          title: "Product Created!",
          description: "Your new product has been added to the store.",
        })
        router.push("/dashboard/teacher");
    } catch(error) {
        console.error("Error creating product: ", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem creating your product. Please try again.",
        })
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="container py-8">
        <div className="max-w-2xl mx-auto">
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href="/dashboard/teacher">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Teacher Dashboard
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Product</CardTitle>
                    <CardDescription>Fill out the form below to add a new course or resource to the store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Title</FormLabel>
                                    <FormControl><Input placeholder="e.g., Introduction to Algebra" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Description</FormLabel>
                                    <FormControl><Textarea placeholder="Describe the product in detail..." className="min-h-[120px] resize-y" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price ($)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" placeholder="e.g., 29.99" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

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

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Product
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
