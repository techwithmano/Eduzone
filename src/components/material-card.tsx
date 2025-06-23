
"use client";

import { Card } from "@/components/ui/card";
import { type Material } from "@/lib/types";
import { Button } from "./ui/button";
import { Trash2, ExternalLink } from "lucide-react";
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

interface MaterialCardProps {
  material: Material;
  isTeacher?: boolean;
  onDelete?: () => void;
}

export function MaterialCard({ material, isTeacher = false, onDelete }: MaterialCardProps) {

  const cardContent = (
     <div className="flex justify-between items-center p-4 gap-4">
        <div className="flex-1 space-y-1 overflow-hidden">
            <h3 className="font-semibold text-card-foreground truncate">{material.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{material.description}</p>
        </div>
        <div className="flex items-center shrink-0">
            <Button variant="secondary" size="sm" asChild>
                <a href={material.link} target="_blank" rel="noopener noreferrer">
                    Open
                    <ExternalLink className="ml-2 h-4 w-4" />
                </a>
            </Button>
            {isTeacher && onDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-1">
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the material "{material.title}". This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
