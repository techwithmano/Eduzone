
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";

import { type Classroom } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function ClassroomPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const classroomId = params.productId as string;

    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classroomId) return;
        
        const fetchClassroom = async () => {
            setLoading(true);
            try {
                const classroomDocRef = doc(db, "classrooms", classroomId);
                const classroomDoc = await getDoc(classroomDocRef);

                if (classroomDoc.exists()) {
                    setClassroom({ id: classroomDoc.id, ...classroomDoc.data() } as Classroom);
                } else {
                    console.error("No such document!");
                    toast({
                        variant: "destructive",
                        title: "Classroom not found",
                        description: "Redirecting you back to the classroom list.",
                    });
                    router.push('/store');
                }
            } catch (error) {
                console.error("Error fetching classroom:", error);
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch classroom details.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchClassroom();
    }, [classroomId, router, toast]);

    const handleRequestToJoin = () => {
        if (!user) {
            router.push('/auth');
        } else {
            toast({
                title: "Feature coming soon!",
                description: "The ability to request to join a class is not yet implemented.",
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
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-48" />
                    </div>
                </div>
            </div>
        );
    }

    if (!classroom) {
        return (
            <div className="container text-center py-20">
                <h1 className="text-2xl font-bold">Classroom not found</h1>
                <p className="text-muted-foreground">The classroom you were looking for does not exist.</p>
                <Button asChild className="mt-4">
                    <Link href="/store">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Browse
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
                        Back to Browse Classrooms
                    </Link>
                </Button>
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    <div className="relative aspect-video">
                         <Image
                            src={classroom.imageUrl}
                            alt={classroom.title}
                            fill
                            className="object-cover rounded-lg border"
                            data-ai-hint="classroom"
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Badge variant="outline">{classroom.subject}</Badge>
                            <h1 className="text-3xl md:text-4xl font-bold font-headline">{classroom.title}</h1>
                        </div>
                        <p className="text-muted-foreground text-lg">{classroom.description}</p>
                        
                        <Button size="lg" onClick={handleRequestToJoin}>
                            <UserPlus className="mr-2 h-5 w-5" />
                            Request to Join
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
