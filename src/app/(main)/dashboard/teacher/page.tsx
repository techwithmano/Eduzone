
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { type Product } from "@/components/product-card";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Loader2, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";


type TeacherProduct = Product & { creatorName?: string };

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<TeacherProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<TeacherProduct | null>(null);

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

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "products"), where("creatorId", "==", user.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const userProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherProduct[];
        setProducts(userProducts);
      } catch (error) {
        console.error("Error fetching user products: ", error);
        toast({ variant: "destructive", title: "Error fetching products", description: "There was an issue retrieving your products. Please try refreshing the page."})
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user, authLoading, router, toast]);

  const handleDeleteClick = (product: TeacherProduct) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
        await deleteDoc(doc(db, "products", productToDelete.id));
        setProducts(products.filter(p => p.id !== productToDelete.id));
        toast({
            title: "Product Deleted",
            description: `"${productToDelete.title}" has been successfully deleted.`,
        });
    } catch (error) {
        console.error("Error deleting product: ", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "There was a problem deleting the product. Please try again.",
        });
    } finally {
        setIsAlertOpen(false);
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
            product "{productToDelete?.title}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
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
            <p className="text-muted-foreground">Manage your educational content here.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Product
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
          <CardDescription>A list of all the products you have created.</CardDescription>
        </CardHeader>
        <CardContent>
            {products.length > 0 ? (
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
                    {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.title}</TableCell>
                          <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{product.category}</Badge></TableCell>
                          <TableCell className="text-right hidden md:table-cell">${product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/dashboard/teacher/edit/${product.id}`}>
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">Edit</span>
                                  </Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                              </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
             </div>
          ) : (
            <div className="text-center py-16">
                <h3 className="text-lg font-semibold">No products yet!</h3>
                <p className="text-muted-foreground mt-2">Click the button above to create your first product.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
