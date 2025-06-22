
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { type Product } from "@/lib/types";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/product-card";
import { Search, Loader2 } from "lucide-react";
import { CourseCardSkeleton } from "@/components/course-card-skeleton";

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);
      setProducts(fetchedProducts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(products.map(item => item.category)))];
  }, [products]);

  const filteredItems = useMemo(() => {
    return products.filter(item => {
      const searchMatch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = category === "All" || item.category === category;
      return searchMatch && categoryMatch;
    });
  }, [searchTerm, category, products]);

  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-16 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Browse Our Store</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              Find courses, study materials, and more from our expert teachers.
            </p>
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for products..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory} disabled={loading}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No Products Found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters, or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
