
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


const productSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  category: z.string({ required_error: "Please select a category."}).min(1, "Please select a category."),
  subject: z.string({ required_error: "Please select a subject."}).min(1, "Please select a subject."),
});

const categories = ["Course", "Notes", "Mock Exam", "Worksheet"];
const subjects = ["Math", "Programming", "History", "Science", "English"];

export default function EditProductPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const productId = params.productId as string;

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      category: undefined,
      subject: undefined,
    },
  });
  
  useEffect(() => {
    if (!productId) return;

    const fetchProductData = async () => {
      try {
        const productDocRef = doc(db, "products", productId);
        const productDoc = await getDoc(productDocRef);

        if (productDoc.exists()) {
          const productData = productDoc.data();
          form.reset(productData);
        } else {
          toast({ variant: "destructive", title: "Product not found" });
          router.push("/dashboard/teacher");
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        toast({ variant: "destructive", title: "Failed to load product data" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [productId, form, router, toast]);

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    setSubmitting(true);
    try {
        const productDocRef = doc(db, "products", productId);
        await updateDoc(productDocRef, values);
        toast({
          title: "Product Updated!",
          description: "Your product has been successfully updated.",
        })
        router.push("/dashboard/teacher");
    } catch(error) {
        console.error("Error updating product: ", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem updating your product. Please try again.",
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
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
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
                <Link href="/dashboard/teacher">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Teacher Dashboard
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Product</CardTitle>
                    <CardDescription>Update the details for your course or resource.</CardDescription>
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
                                        <Select onValueChange={field.onChange} value={field.value}>
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
