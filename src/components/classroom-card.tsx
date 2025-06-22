
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Classroom } from "@/lib/types";

interface ClassroomCardProps {
  classroom: Classroom;
}

export function ClassroomCard({ classroom }: ClassroomCardProps) {
  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={classroom.imageUrl}
            alt={classroom.title}
            fill
            className="object-cover rounded-t-lg"
            data-ai-hint="classroom"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="secondary">{classroom.subject}</Badge>
        </div>
        <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">{classroom.title}</CardTitle>
        <p className="text-sm text-muted-foreground flex-1 line-clamp-3">{classroom.description}</p>
      </CardContent>
      <CardFooter className="p-4">
        <Button asChild className="w-full">
            <Link href={`/dashboard/student/classroom/${classroom.id}`}>View Classroom</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
