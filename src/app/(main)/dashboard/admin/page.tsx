
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, query, where, onSnapshot, orderBy, writeBatch, arrayRemove, doc, getDocs, addDoc, serverTimestamp, deleteDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { type Classroom, type Product } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Loader2, BookOpen, Trash2, ShoppingBag } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(5000),
  category: z.string().min(3, "Category is required."),
  language: z.string().min(2, "Language is required."),
  priceKWD: z.coerce.number().min(0, "Price must be a positive number."),
});

const seedProducts = [
    { title: "English Foundation Course", category: "Foundation", language: "English", priceKWD: 10, description: "A comprehensive course to build a strong foundation in the English language, covering grammar, vocabulary, and conversational skills." },
    { title: "Arabic Foundation Course", category: "Foundation", language: "Arabic", priceKWD: 10, description: "Master the fundamentals of Arabic. This course is perfect for beginners, focusing on script, basic grammar, and essential vocabulary." },
    { title: "Math Foundation Course", category: "Foundation", language: "English/Arabic", priceKWD: 12, description: "Strengthen your mathematical skills with this bilingual course covering core concepts from arithmetic to pre-algebra." },
    { title: "Kuwait Ministry Curriculum Tutoring", category: "Local Curriculum", language: "Arabic", priceKWD: 15, description: "Get expert tutoring for all subjects in the Kuwaiti Ministry of Education curriculum. Personalized for your success." },
    { title: "American Diploma Subjects Tutoring", category: "American Diploma", language: "English", priceKWD: 20, description: "Ace your American Diploma with specialized tutoring in subjects like English, Math, Science, and Social Studies." },
    { title: "IGCSE Subjects (Math, ICT, Biology...)", category: "IGCSE", language: "English", priceKWD: 18, description: "Prepare for your IGCSE exams with our expert-led courses in a wide range of subjects." },
    { title: "Law Subjects Coaching", category: "University", language: "English/Arabic", priceKWD: 25, description: "Navigate the complexities of law school with our dedicated coaching for various university-level law subjects." },
    { title: "GMAT Prep Course", category: "University Exams", language: "English", priceKWD: 30, description: "Maximize your GMAT score with our intensive preparation course, featuring practice tests and expert strategies." },
    { title: "Qudrat Exam Preparation", category: "Local Exams", language: "Arabic", priceKWD: 12, description: "Achieve your best score on the Qudrat exam with our focused preparation materials and mock tests." },
    { title: "IELTS / TOEFL Preparation", category: "Language Tests", language: "English", priceKWD: 20, description: "Reach your target score with our comprehensive IELTS and TOEFL preparation courses." },
    { title: "OET Course for Healthcare Professionals", category: "Medical English", language: "English", priceKWD: 28, description: "Specialized English training for doctors, nurses, and other healthcare professionals preparing for the OET." },
    { title: "French Language Course", category: "Languages", language: "French", priceKWD: 15, description: "Learn the language of love and diplomacy. Our French course takes you from beginner to conversational." },
    { title: "German Language Course", category: "Languages", language: "German", priceKWD: 15, description: "Start your journey to learning German with our structured course focusing on practical communication." }
];


export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [isClassroomAlertOpen, setIsClassroomAlertOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);

  const [isProductAlertOpen, setIsProductAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { title: "", description: "", category: "", language: "", priceKWD: 0 },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    const seedDatabase = async () => {
        const productsRef = collection(db, "products");
        const q = query(productsRef, limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            toast({ title: "Setting up store...", description: "Adding initial products to the database." });
            const batch = writeBatch(db);
            seedProducts.forEach(product => {
                const docRef = doc(productsRef);
                batch.set(docRef, {
                    ...product,
                    creatorId: user.uid,
                    creatorName: user.displayName || "EduZone Admin",
                    imageUrl: `https://placehold.co/600x400.png?text=${product.category.replace(' ', '+')}`,
                    createdAt: serverTimestamp(),
                });
            });
            await batch.commit();
        }
    };
    seedDatabase();


    setLoading(true);
    const classroomQuery = query(
        collection(db, "classrooms"), 
        where("creatorId", "==", user.uid),
        orderBy("createdAt", "desc")
    );
    const productQuery = query(
        collection(db, "products"),
        where("creatorId", "==", user.uid),
        orderBy("createdAt", "desc")
    );

    const unsubClassrooms = onSnapshot(classroomQuery, (querySnapshot) => {
        const userClassrooms = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Classroom[];
        setClassrooms(userClassrooms);
        setLoading(false);
    }, (error) => {
        toast({ variant: "destructive", title: "Error fetching classrooms" });
        setLoading(false);
    });

    const unsubProducts = onSnapshot(productQuery, (querySnapshot) => {
        const userProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(userProducts);
    }, (error) => {
        toast({ variant: "destructive", title: "Error fetching products" });
    });

    return () => {
      unsubClassrooms();
      unsubProducts();
    };
  }, [user, authLoading, router, toast]);

  // Classroom Deletion
  const handleDeleteClassroomClick = (classroom: Classroom) => {
    setClassroomToDelete(classroom);
    setIsClassroomAlertOpen(true);
  };
  
  const handleDeleteClassroomConfirm = async () => {
    if (!classroomToDelete || !user) return;
    try {
        const batch = writeBatch(db);
        const classroomDocRef = doc(db, "classrooms", classroomToDelete.id);
        batch.delete(classroomDocRef);
        const userDocRef = doc(db, "users", user.uid);
        batch.update(userDocRef, { createdClassroomIds: arrayRemove(classroomToDelete.id) });
        const enrolledIds = classroomToDelete.enrolledStudentIds;
        if(enrolledIds && enrolledIds.length > 0) {
           const studentsQuery = query(collection(db, "users"), where('__name__', 'in', enrolledIds));
           const studentDocs = await getDocs(studentsQuery);
           studentDocs.forEach(studentDoc => {
               batch.update(studentDoc.ref, { enrolledClassroomIds: arrayRemove(classroomToDelete.id) });
           });
        }
        await batch.commit();
        toast({ title: "Classroom Deleted" });
    } catch (error) {
        toast({ variant: "destructive", title: "Deletion Failed" });
    } finally {
        setIsClassroomAlertOpen(false);
        setClassroomToDelete(null);
    }
  };

  // Product Management
  const handleCreateProduct = async (values: z.infer<typeof productSchema>) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "products"), {
        ...values,
        creatorId: user.uid,
        creatorName: user.displayName,
        imageUrl: `https://placehold.co/600x400.png?text=${values.category.replace(' ', '+')}`,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Product Added!", description: "Your new product is now live in the store." });
      productForm.reset();
      setIsProductDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create product." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProductClick = (product: Product) => {
    setProductToDelete(product);
    setIsProductAlertOpen(true);
  };

  const handleDeleteProductConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, "products", productToDelete.id));
      toast({ title: "Product Deleted", description: `"${productToDelete.title}" has been removed from the store.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    } finally {
      setIsProductAlertOpen(false);
      setProductToDelete(null);
    }
  };


  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14))] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <>
    <AlertDialog open={isClassroomAlertOpen} onOpenChange={setIsClassroomAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the classroom "{classroomToDelete?.title}" and remove it from all enrolled students.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setClassroomToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteClassroomConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    <AlertDialog open={isProductAlertOpen} onOpenChange={setIsProductAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the product "{productToDelete?.title}" from the store.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteProductConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div className="container py-8">
      <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your classrooms and store products.</p>
      </div>

       <Tabs defaultValue="classrooms" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="classrooms"><BookOpen className="mr-2 h-4 w-4" />My Classrooms</TabsTrigger>
            <TabsTrigger value="products"><ShoppingBag className="mr-2 h-4 w-4" />My Products</TabsTrigger>
          </TabsList>
          
          <TabsContent value="classrooms">
            <Card>
              <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>Your Classrooms</CardTitle>
                      <CardDescription>A list of all the classrooms you have created.</CardDescription>
                    </div>
                    <Button asChild>
                      <Link href="/dashboard/admin/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Classroom
                      </Link>
                    </Button>
                  </div>
              </CardHeader>
              <CardContent>
                  {classrooms.length > 0 ? (
                  <div className="border rounded-md">
                      <Table>
                          <TableHeader>
                          <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead className="hidden sm:table-cell">Subject</TableHead>
                              <TableHead className="hidden sm:table-cell text-center">Enrolled</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>
                          {classrooms.map((classroom) => (
                              <TableRow key={classroom.id}>
                                <TableCell className="font-medium">{classroom.title}</TableCell>
                                <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{classroom.subject}</Badge></TableCell>
                                <TableCell className="hidden sm:table-cell text-center">{classroom.enrolledStudentIds?.length || 0}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/dashboard/admin/classroom/${classroom.id}`}>
                                          <BookOpen className="mr-2 h-4 w-4" />
                                          Manage
                                      </Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClassroomClick(classroom)} title="Delete Classroom" className="ml-2">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        <span className="sr-only">Delete Classroom</span>
                                    </Button>
                                </TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-semibold">No classrooms yet!</h3>
                      <p className="text-muted-foreground mt-2">Click the button above to create your first classroom.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
               <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>Your Products</CardTitle>
                      <CardDescription>A list of all products you've added to the store.</CardDescription>
                    </div>
                     <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                        <DialogTrigger asChild>
                          <Button><PlusCircle className="mr-2 h-4 w-4" />Add New Product</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>New Product</DialogTitle>
                            <DialogDescription>Fill in the details for the new product to sell in the store.</DialogDescription>
                          </DialogHeader>
                          <Form {...productForm}>
                            <form onSubmit={productForm.handleSubmit(handleCreateProduct)} className="grid gap-4 py-4">
                                <FormField control={productForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={productForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={productForm.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={productForm.control} name="language" render={({ field }) => ( <FormItem><FormLabel>Language</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={productForm.control} name="priceKWD" render={({ field }) => ( <FormItem><FormLabel>Price (KWD)</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <DialogFooter>
                                  <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                  <Button type="submit" disabled={isSubmitting}>
                                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Add to Store
                                  </Button>
                                </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                  </div>
              </CardHeader>
              <CardContent>
                 {products.length > 0 ? (
                  <div className="border rounded-md">
                      <Table>
                          <TableHeader>
                          <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead className="hidden sm:table-cell">Category</TableHead>
                              <TableHead className="hidden sm:table-cell text-center">Price</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>
                          {products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.title}</TableCell>
                                <TableCell className="hidden sm:table-cell"><Badge variant="outline">{product.category}</Badge></TableCell>
                                <TableCell className="hidden sm:table-cell text-center">{(product.priceKWD || 0).toFixed(2)} KWD</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProductClick(product)} title="Delete Product" className="ml-2">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        <span className="sr-only">Delete Product</span>
                                    </Button>
                                </TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-semibold">No products yet!</h3>
                      <p className="text-muted-foreground mt-2">Click the button above to add your first product to the store.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
