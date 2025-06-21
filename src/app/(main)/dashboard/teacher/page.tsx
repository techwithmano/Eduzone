"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { type Product } from "@/components/product-card";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";

type TeacherProduct = Product & { creatorName?: string };

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<TeacherProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, "products"), where("creatorId", "==", user.uid), orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);
          const userProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherProduct[];
          setProducts(userProducts);
        } catch (error) {
          console.error("Error fetching user products: ", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [user]);

  if (authLoading) {
    return (
       <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-48" />
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
      return <div className="container py-8"><p>Please log in to view the teacher dashboard.</p></div>
  }

  return (
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
            {loading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : products.length > 0 ? (
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead className="hidden md:table-cell">Subject</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{product.category}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="outline">{product.subject}</Badge></TableCell>
                        <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
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
  );
}
