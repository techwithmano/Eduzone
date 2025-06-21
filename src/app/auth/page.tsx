import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

export default function AuthPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
             <div className="absolute top-4 left-4">
                <Link href="/" className="flex items-center space-x-2 text-foreground/80 hover:text-foreground">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="font-bold">EduZone</span>
                </Link>
             </div>
             <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Coming Soon!</CardTitle>
                    <CardDescription>Our authentication system is being built. Please check back later.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground">
                        <p>This page will contain the login and signup forms for students and teachers.</p>
                    </div>
                </CardContent>
             </Card>
        </div>
    )
}
