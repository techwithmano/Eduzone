
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AssignmentCardProps {
  assignment: Assignment;
  classroomId: string;
  isTeacher?: boolean;
  onDelete?: () => void;
}

export function AssignmentCard({ assignment, classroomId, isTeacher = false, onDelete }: AssignmentCardProps) {
  const dueDate = assignment.dueDate ? format(assignment.dueDate.toDate(), "PPP") : 'No due date';

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
                 <Link href={`/dashboard/teacher/classroom/${classroomId}/assignment/${assignment.id}`}>
                    View Submissions
                    <ArrowRight className="ml-2 h-4 w-4" />
                 </Link>
              </Button>
              {onDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
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
                        <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          ) : (
              <Button asChild variant="secondary" size="sm">
                  <Link href={`/dashboard/student/classroom/${classroomId}/assignment/${assignment.id}`}>
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
