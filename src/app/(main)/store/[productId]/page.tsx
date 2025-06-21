
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";

import { type Course } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const courseId = params.productId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId) return;
        
        const fetchCourse = async () => {
            setLoading(true);
            try {
                const courseDocRef = doc(db, "products", courseId);
                const courseDoc = await getDoc(courseDocRef);

                if (courseDoc.exists()) {
                    setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
                } else {
                    console.error("No such document!");
                    toast({
                        variant: "destructive",
                        title: "Course not found",
                        description: "Redirecting you back to the marketplace.",
                    });
                    router.push('/store');
                }
            } catch (error) {
                console.error("Error fetching course:", error);
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch course details.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId, router, toast]);

    const handleBuyNow = () => {
        if (!user) {
            router.push('/auth');
        } else {
            toast({
                title: "Thank you for your interest!",
                description: "Full checkout and payment processing is coming soon.",
            });
        }
    };
    
    if (loading) {
        return (
            <div className="container py-8 md:py-12">
                <Skeleton className="h-8 w-48 mb-8" />
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-3/4" />
                        <div className="flex gap-4">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-32" />
                        <Skeleton className="h-12 w-40" />
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container text-center py-20">
                <h1 className="text-2xl font-bold">Course not found</h1>
                <p className="text-muted-foreground">The course you were looking for does not exist.</p>
                <Button asChild className="mt-4">
                    <Link href="/store">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Marketplace
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-background">
            <div className="container py-8 md:py-12">
                <Button variant="ghost" asChild className="mb-8">
                    <Link href="/store">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Marketplace
                    </Link>
                </Button>
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    <div className="relative aspect-video">
                         <Image
                            src={course.imageUrl}
                            alt={course.title}
                            fill
                            className="object-cover rounded-lg border"
                            data-ai-hint="course thumbnail"
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Badge variant="secondary">{course.category}</Badge>
                                <Badge variant="outline">{course.subject}</Badge>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold font-headline">{course.title}</h1>
                        </div>
                        <p className="text-muted-foreground text-lg">{course.description}</p>
                        <p className="text-4xl font-bold text-primary">${course.price.toFixed(2)}</p>
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
