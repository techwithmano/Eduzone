import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  subject: string;
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover rounded-t-lg"
            data-ai-hint="course thumbnail"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="secondary">{product.category}</Badge>
          <p className="text-xs text-muted-foreground">{product.subject}</p>
        </div>
        <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">{product.title}</CardTitle>
        <p className="text-sm text-muted-foreground flex-1 line-clamp-3">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
        <Button>Buy Now</Button>
      </CardFooter>
    </Card>
  );
}
