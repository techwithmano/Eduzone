
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type StoreItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  item: StoreItem;
}

export function ProductCard({ item }: ProductCardProps) {
    const { toast } = useToast();

    const handleViewDetails = () => {
        toast({
            title: "Feature Coming Soon",
            description: "Detailed course pages are under construction.",
        });
    };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover rounded-t-lg"
            data-ai-hint={item.dataAiHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="secondary">{item.category}</Badge>
          <p className="font-semibold text-sm">{item.priceKWD} KWD</p>
        </div>
        <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">{item.title}</CardTitle>
        <CardDescription className="flex-1 line-clamp-3 text-xs">{item.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4">
        <Button className="w-full" onClick={handleViewDetails}>
            View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
