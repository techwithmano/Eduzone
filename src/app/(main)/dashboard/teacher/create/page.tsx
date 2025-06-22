
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeprecatedTeacherCreatePage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    toast({
        title: "Permission Denied",
        description: "Only Admins can create new classrooms. Redirecting...",
        variant: "destructive",
    })
    router.replace('/dashboard/teacher');
  }, [router, toast]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
    </div>
  );
}
