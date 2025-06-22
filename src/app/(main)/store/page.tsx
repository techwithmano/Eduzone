
"use client";

import { useState, useMemo } from "react";
import { storeItems } from "@/lib/store-data";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/product-card";
import { Search } from "lucide-react";

const categories = ["All", ...Array.from(new Set(storeItems.map(item => item.category)))];

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");

  const filteredItems = useMemo(() => {
    return storeItems.filter(item => {
      const searchMatch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = category === "All" || item.category === category;
      return searchMatch && categoryMatch;
    });
  }, [searchTerm, category]);

  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-16 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Browse Our Courses</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              Find foundation courses, tutoring, exam prep, and language classes.
            </p>
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for courses..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No Courses Found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
