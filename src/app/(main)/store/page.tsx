
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClassroomCard, type Classroom } from "@/components/product-card";
import { Search } from "lucide-react";
import { CourseCardSkeleton } from "@/components/course-card-skeleton";

const subjects = ["All", "Math", "Programming", "History", "Science", "English", "Art", "Music"];

export default function StorePage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subject, setSubject] = useState("All");

  useEffect(() => {
    const fetchClassrooms = async () => {
      setLoading(true);
      try {
        const classroomsCollection = collection(db, "classrooms");
        const classroomSnapshot = await getDocs(classroomsCollection);
        const classroomList = classroomSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            imageUrl: data.imageUrl,
            subject: data.subject,
          }
        }) as Classroom[];
        setClassrooms(classroomList);
      } catch (error) {
        console.error("Error fetching classrooms: ", error);
        // In a real app, you might want to show a toast notification here
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(classroom => {
      const searchMatch = classroom.title.toLowerCase().includes(searchTerm.toLowerCase()) || classroom.description.toLowerCase().includes(searchTerm.toLowerCase());
      const subjectMatch = subject === "All" || classroom.subject === subject;
      return searchMatch && subjectMatch;
    });
  }, [classrooms, searchTerm, subject]);

  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-16 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Browse Classrooms</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              Explore available classrooms and subjects.
            </p>
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for classrooms..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex gap-4">
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
        ) : filteredClassrooms.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClassrooms.map(classroom => (
              <ClassroomCard key={classroom.id} classroom={classroom} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No Classrooms Found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters. You may need to add classrooms to the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
