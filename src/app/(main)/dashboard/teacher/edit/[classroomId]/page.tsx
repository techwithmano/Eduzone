
"use client";

// This page is deprecated and its logic has been moved to the main classroom page
// It now redirects to the classroom page's settings tab.

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedEditClassroomPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params.classroomId as string;

  useEffect(() => {
    if (classroomId) {
      router.replace(`/dashboard/teacher/classroom/${classroomId}?tab=settings`);
    } else {
      router.replace('/dashboard/teacher');
    }
  }, [router, classroomId]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecting to classroom settings...</p>
        </div>
    </div>
  );
}
