
"use client";

import { Card } from "@/components/ui/card";
import { type Assignment } from "@/lib/types";
import { format } from "date-fns";
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

interface AssignmentCardProps {
  assignment: Assignment;
  classroomId: string;
  isTeacher?: boolean; // isTeacher is now generic for ADMIN or TEACHER
  onDelete?: () => void;
}

export function AssignmentCard({ assignment, classroomId, isTeacher = false, onDelete }: AssignmentCardProps) {
  const { user } = useAuth();
  const dueDate = assignment.dueDate ? format(assignment.dueDate.toDate(), "PPP") : 'No due date';

  const getLinkPath = () => {
    if (user?.role === 'ADMIN') {
        return `/dashboard/admin/classroom/${classroomId}/assignment/${assignment.id}`;
    }
    if (user?.role === 'TEACHER') {
        return `/dashboard/teacher/classroom/${classroomId}/assignment/${assignment.id}`;
    }
    return `/dashboard/student/classroom/${classroomId}/assignment/${assignment.id}`;
  }

  const cardContent = (
     <div className="flex justify-between items-center p-4 gap-4">
        <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-card-foreground">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground">Due: {dueDate}</p>
        </div>
        <div className="flex items-center shrink-0">
          {isTeacher ? (
            <>
              <Button variant="secondary" size="sm" asChild>
                 <Link href={getLinkPath()}>
                    View Submissions
                    <ArrowRight className="ml-2 h-4 w-4" />
                 </Link>
              </Button>
              {onDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the assignment "{assignment.title}". This action cannot be undone.
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
                      View Assignment
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
