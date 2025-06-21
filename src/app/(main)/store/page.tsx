
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseCard, type Course } from "@/components/product-card";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const categories = ["All", "Course", "Notes", "Mock Exam", "Worksheet"];
const subjects = ["All", "Math", "Programming", "History", "Science", "English"];

const CourseCardSkeleton = () => (
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


export default function StorePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [subject, setSubject] = useState("All");

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const coursesCollection = collection(db, "products");
        const courseSnapshot = await getDocs(coursesCollection);
        const courseList = courseSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            price: data.price,
            imageUrl: data.imageUrl,
            category: data.category,
            subject: data.subject,
          }
        }) as Course[];
        setCourses(courseList);
      } catch (error) {
        console.error("Error fetching courses: ", error);
        // In a real app, you might want to show a toast notification here
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const searchMatch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = category === "All" || course.category === category;
      const subjectMatch = subject === "All" || course.subject === subject;
      return searchMatch && categoryMatch && subjectMatch;
    });
  }, [courses, searchTerm, category, subject]);

  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-16 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Course Marketplace</h1>
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
              disabled={loading}
            />
          </div>
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory} disabled={loading}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={subject} onValueChange={setSubject} disabled={loading}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
           </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No Courses Found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters. You may also need to add courses to the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
