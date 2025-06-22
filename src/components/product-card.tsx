
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Product } from "@/lib/types";

interface ProductCardProps {
  item: Product;
}

export function ProductCard({ item }: ProductCardProps) {
  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover rounded-t-lg"
            data-ai-hint={item.dataAiHint || "product image"}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="secondary">{item.category}</Badge>
          <p className="font-semibold text-sm">{item.priceKWD.toFixed(2)} KWD</p>
        </div>
        <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">{item.title}</CardTitle>
        <CardDescription className="flex-1 line-clamp-3 text-xs">{item.description}</CardDescription>
         <p className="text-xs text-muted-foreground mt-2">Sold by: {item.creatorName}</p>
      </CardContent>
      <CardFooter className="p-4">
        <Button asChild className="w-full">
          <Link href={`/store/${item.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
