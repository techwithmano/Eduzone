"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CourseCardSkeleton = () => (
  <Card>
    <CardHeader className="p-0">
      <Skeleton className="aspect-video w-full rounded-t-lg" />
    </CardHeader>
    <CardContent className="p-4 space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </CardContent>
    <CardFooter className="p-4 flex justify-between items-center">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-10 w-1/3" />
    </CardFooter>
  </Card>
);
