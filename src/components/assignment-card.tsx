
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type Assignment } from "@/lib/types";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Trash2, Edit, ArrowRight } from "lucide-react";
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
  onEdit?: () => void;
}

export function AssignmentCard({ assignment, classroomId, isTeacher = false, onDelete, onEdit }: AssignmentCardProps) {
  const dueDate = assignment.dueDate ? format(assignment.dueDate.toDate(), "PPP") : 'No due date';

  const cardContent = (
     <div className="flex justify-between items-center p-4">
        <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <CardDescription>Due: {dueDate}</CardDescription>
        </div>
        {isTeacher ? (
             <div className="flex items-center">
                <Button variant="secondary" size="sm">
                  View Submissions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
             </div>
        ) : (
            <Button asChild variant="secondary" size="sm">
                <Link href={`/dashboard/student/classroom/${classroomId}/assignment/${assignment.id}`}>
                    View Assignment
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        )}
    </div>
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      {isTeacher ? (
        <Link href={`/dashboard/teacher/classroom/${classroomId}/assignment/${assignment.id}`} className="block">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </Card>
  );
}
