
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";

import { type Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default function ProductPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const productId = params.productId as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) return;
        
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const productDocRef = doc(db, "products", productId);
                const productDoc = await getDoc(productDocRef);

                if (productDoc.exists()) {
                    setProduct({ id: productDoc.id, ...productDoc.data() } as Product);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Product not found",
                        description: "Redirecting you back to the store.",
                    });
                    router.push('/store');
                }
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch product details.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId, router, toast]);

    const handleBuyNow = () => {
        if (!user) {
            toast({
                title: "Please log in",
                description: "You need to be logged in to purchase items.",
                variant: 'destructive'
            });
            router.push('/auth');
        } else {
            toast({
                title: "Feature coming soon!",
                description: "The payment system is not yet implemented.",
            });
        }
    };
    
    if (loading) {
        return (
            <div className="container py-8 md:py-12">
                <Skeleton className="h-8 w-48 mb-8" />
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-48" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container text-center py-20">
                <h1 className="text-2xl font-bold">Product not found</h1>
                <p className="text-muted-foreground">The product you were looking for does not exist.</p>
                <Button asChild className="mt-4">
                    <Link href="/store">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Store
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-background">
            <div className="container py-8 md:py-12">
                <Button variant="ghost" asChild className="mb-8 -ml-4">
                    <Link href="/store">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Store
                    </Link>
                </Button>
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    <div className="relative aspect-square">
                         <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover rounded-lg border"
                            data-ai-hint="product image"
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Badge variant="outline">{product.category}</Badge>
                            <h1 className="text-3xl md:text-4xl font-bold font-headline">{product.title}</h1>
                            <p className="text-sm text-muted-foreground">Language: {product.language}</p>
                            <p className="text-sm text-muted-foreground">Sold by: {product.creatorName}</p>
                        </div>
                        <p className="text-muted-foreground text-lg">{product.description}</p>
                        <p className="text-3xl font-bold">{product.priceKWD.toFixed(2)} KWD</p>
                        
                        <Button size="lg" onClick={handleBuyNow}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Buy Now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
