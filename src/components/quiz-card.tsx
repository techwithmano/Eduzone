
"use client";

import { Card } from "@/components/ui/card";
import { type Quiz } from "@/lib/types";
import { Button } from "./ui/button";
import { Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
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
import { useAuth } from "./providers/auth-provider";

interface QuizCardProps {
  quiz: Quiz;
  classroomId: string;
  isTeacher?: boolean;
  onDelete?: () => void;
}

export function QuizCard({ quiz, classroomId, isTeacher = false, onDelete }: QuizCardProps) {
  const { user } = useAuth();
  
  const getLinkPath = () => {
    if (user?.role === 'ADMIN') {
        return `/dashboard/admin/classroom/${classroomId}/quiz/${quiz.id}`;
    }
    if (user?.role === 'TEACHER') {
        return `/dashboard/teacher/classroom/${classroomId}/quiz/${quiz.id}`;
    }
    return `/dashboard/student/classroom/${classroomId}/quiz/${quiz.id}`;
  }

  const cardContent = (
     <div className="flex justify-between items-center p-4 gap-4">
        <div className="flex-1 space-y-1 overflow-hidden">
            <h3 className="font-semibold text-card-foreground truncate">{quiz.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{quiz.description}</p>
        </div>
        <div className="flex items-center shrink-0">
          {isTeacher ? (
            <>
              <Button variant="secondary" size="sm" asChild>
                 <Link href={getLinkPath()}>
                    View Results
                    <ArrowRight className="ml-2 h-4 w-4" />
                 </Link>
              </Button>
              {onDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} className="ml-1">
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the quiz "{quiz.title}". This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          ) : (
              <Button asChild variant="secondary" size="sm">
                  <Link href={getLinkPath()}>
                      Start Quiz
                      <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
              </Button>
          )}
        </div>
    </div>
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      {cardContent}
    </Card>
  );
}
