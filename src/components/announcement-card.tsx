
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type Announcement } from "@/lib/types";
import { formatRelative } from "date-fns";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
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

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete?: () => void;
}

export function AnnouncementCard({ announcement, onDelete }: AnnouncementCardProps) {
  const formattedDate = announcement.createdAt ? formatRelative(announcement.createdAt.toDate(), new Date()) : 'just now';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <p className="text-sm font-semibold">{announcement.authorName}</p>
                <p className="text-xs text-muted-foreground capitalize">{formattedDate}</p>
            </div>
            {onDelete && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Announcement</span>
                         </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this announcement. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        <p className="mt-3 text-sm">{announcement.content}</p>
      </CardContent>
    </Card>
  );
}
