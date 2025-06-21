import Image from "next/image";
import { Users, Target, Eye } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">About EduZone</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              We are dedicated to transforming education by providing a unified, accessible, and powerful platform for both teachers and students.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter mb-4 font-headline">Our Mission & Vision</h2>
              <p className="text-muted-foreground mb-4">
                Our mission is to empower educators with the tools they need to create inspiring and effective learning experiences. We believe that technology should simplify classroom management, not complicate it. By providing a seamless, all-in-one solution, we free up teachers to focus on what they do best: teaching.
              </p>
              <p className="text-muted-foreground">
                Our vision is a world where every student has access to high-quality education, regardless of their location or background. EduZone aims to bridge the gap between traditional and digital learning, creating a global community of lifelong learners.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg text-center">
                    <Target className="h-10 w-10 text-primary mx-auto mb-2" />
                    <h3 className="text-xl font-bold">Mission</h3>
                    <p className="text-sm text-muted-foreground">Empower Educators</p>
                </div>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-secondary rounded-lg text-center">
                    <Eye className="h-10 w-10 text-primary mx-auto mb-2" />
                    <h3 className="text-xl font-bold">Vision</h3>
                    <p className="text-sm text-muted-foreground">Accessible Education</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-10 font-headline">Our Journey</h2>
          <div className="relative">
             <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
             <div className="space-y-16">
                <div className="relative flex items-center">
                    <div className="w-1/2 pr-8 text-right">
                        <div className="p-4 bg-background rounded-lg shadow-md">
                            <h3 className="font-bold">2022 - The Idea</h3>
                            <p className="text-sm text-muted-foreground">EduZone was born from a desire to simplify digital education for teachers and students.</p>
                        </div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 bg-primary h-4 w-4 rounded-full border-4 border-background"></div>
                    <div className="w-1/2 pl-8"></div>
                </div>
                 <div className="relative flex items-center">
                    <div className="w-1/2 pr-8"></div>
                     <div className="absolute left-1/2 -translate-x-1/2 bg-primary h-4 w-4 rounded-full border-4 border-background"></div>
                    <div className="w-1/2 pl-8 text-left">
                         <div className="p-4 bg-background rounded-lg shadow-md">
                            <h3 className="font-bold">2023 - First Launch</h3>
                            <p className="text-sm text-muted-foreground">We launched our beta platform to a select group of schools and gathered valuable feedback.</p>
                        </div>
                    </div>
                </div>
                <div className="relative flex items-center">
                    <div className="w-1/2 pr-8 text-right">
                        <div className="p-4 bg-background rounded-lg shadow-md">
                            <h3 className="font-bold">2024 - AI Integration</h3>
                            <p className="text-sm text-muted-foreground">Introduced our AI-powered tool to help teachers create more engaging course content.</p>
                        </div>
                    </div>
                     <div className="absolute left-1/2 -translate-x-1/2 bg-primary h-4 w-4 rounded-full border-4 border-background"></div>
                    <div className="w-1/2 pl-8"></div>
                </div>
             </div>
          </div>
        </div>
      </section>
      
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-10 font-headline">A Glimpse into EduZone</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Image src="https://placehold.co/400x400.png" alt="Classroom 1" width={400} height={400} className="rounded-lg object-cover aspect-square" data-ai-hint="classroom students" />
              <Image src="https://placehold.co/400x400.png" alt="Classroom 2" width={400} height={400} className="rounded-lg object-cover aspect-square mt-8" data-ai-hint="teacher lecture" />
              <Image src="https://placehold.co/400x400.png" alt="Virtual Session" width={400} height={400} className="rounded-lg object-cover aspect-square" data-ai-hint="online learning" />
              <Image src="https://placehold.co/400x400.png" alt="Collaboration" width={400} height={400} className="rounded-lg object-cover aspect-square mt-8" data-ai-hint="student collaboration" />
           </div>
        </div>
      </section>
    </div>
  );
}
