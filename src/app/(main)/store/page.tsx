"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard, type Product } from "@/components/product-card";
import { Search } from "lucide-react";

const dummyProducts: Product[] = [
  { id: '1', title: 'Advanced Calculus Course', description: 'Deep dive into multivariate calculus and differential equations.', price: 49.99, imageUrl: 'https://placehold.co/600x400.png', category: 'Course', subject: 'Math' },
  { id: '2', title: 'Introduction to Python', description: 'Learn the fundamentals of Python programming from scratch.', price: 29.99, imageUrl: 'https://placehold.co/600x400.png', category: 'Course', subject: 'Programming' },
  { id: '3', title: 'World History Notes', description: 'Comprehensive notes covering major historical events.', price: 9.99, imageUrl: 'https://placehold.co/600x400.png', category: 'Notes', subject: 'History' },
  { id: '4', title: 'Chemistry Mock Exam', description: 'Practice exam with detailed solutions and explanations.', price: 14.99, imageUrl: 'https://placehold.co/600x400.png', category: 'Mock Exam', subject: 'Science' },
  { id: '5', title: 'Grammar Worksheets', description: 'A collection of worksheets to improve your grammar skills.', price: 5.99, imageUrl: 'https://placehold.co/600x400.png', category: 'Worksheet', subject: 'English' },
  { id: '6', title: 'Physics 101 Course', description: 'Master the basics of classical mechanics and electromagnetism.', price: 49.99, imageUrl: 'https://placehold.co/600x400.png', category: 'Course', subject: 'Science' },
  { id: '7', title: 'Algebra Practice Problems', description: 'Hundreds of practice problems to sharpen your algebra skills.', price: 7.99, imageUrl: 'https://placehold.co/600x400.png', category: 'Worksheet', subject: 'Math' },
  { id: '8', 'title': 'React for Beginners', 'description': 'Build modern web applications with React.js.', 'price': 39.99, 'imageUrl': 'https://placehold.co/600x400.png', 'category': 'Course', 'subject': 'Programming' },
];

const categories = ["All", "Course", "Notes", "Mock Exam", "Worksheet"];
const subjects = ["All", "Math", "Programming", "History", "Science", "English"];

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [subject, setSubject] = useState("All");

  const filteredProducts = useMemo(() => {
    return dummyProducts.filter(product => {
      const searchMatch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = category === "All" || product.category === category;
      const subjectMatch = subject === "All" || product.subject === subject;
      return searchMatch && categoryMatch && subjectMatch;
    });
  }, [searchTerm, category, subject]);

  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-16 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">EduZone Store</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              Browse our curated collection of courses and educational resources.
            </p>
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for courses, notes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No Products Found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
