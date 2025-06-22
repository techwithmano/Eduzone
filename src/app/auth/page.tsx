import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
             <div className="absolute top-4 left-4">
                <Link href="/" className="flex items-center space-x-2 text-foreground/80 hover:text-foreground">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="font-bold">EduZone</span>
                </Link>
             </div>
             <Card className="w-full max-w-md shadow-2xl">
                <CardContent className="p-2 sm:p-6">
                    <AuthForm />
                </CardContent>
             </Card>
        </div>
    )
}
