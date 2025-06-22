import Image from "next/image";
import { Users, Target, Eye } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Our Story: More Than a Platform</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              EduZone was founded on a simple belief: technology should empower educators and inspire students, not complicate their lives.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter mb-4 font-headline">Our Mission & Vision</h2>
              <p className="text-muted-foreground">
                Our mission is to equip educators with elegant, powerful tools that streamline classroom management and foster a love of learning. We believe that by simplifying the digital landscape, we give teachers the freedom to focus on what truly matters: igniting curiosity and shaping the next generation of thinkers, leaders, and innovators.
              </p>
              <p className="text-muted-foreground">
                Our vision is to build a global educational ecosystem where access to high-quality learning is universal. EduZone is our commitment to bridging the digital divide, creating a connected community where every student has the opportunity to reach their full potential.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-secondary rounded-lg text-center space-y-2">
                  <Target className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="text-xl font-bold">Our Mission</h3>
                  <p className="text-sm text-muted-foreground">To empower educators and inspire students.</p>
              </div>
              <div className="p-6 bg-secondary rounded-lg text-center space-y-2">
                  <Eye className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="text-xl font-bold">Our Vision</h3>
                  <p className="text-sm text-muted-foreground">Universal access to quality education.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-12 font-headline">The EduZone Journey</h2>
          <div className="relative pl-6 md:pl-0">
             {/* The vertical line */}
             <div className="absolute left-6 md:left-1/2 top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
             
             <div className="space-y-12">
                
                {/* Timeline Item 1 */}
                <div className="relative md:flex md:items-center md:justify-end md:text-right">
                    <div className="md:w-1/2 md:pr-12">
                         <div className="relative p-6 bg-background rounded-lg shadow-md">
                            <div className="absolute -left-9 top-1/2 -translate-y-1/2 md:left-auto md:-right-9">
                               <div className="bg-primary h-4 w-4 rounded-full border-4 border-secondary"></div>
                            </div>
                            <h3 className="font-bold text-lg">2022 - The Spark</h3>
                            <p className="text-sm text-muted-foreground mt-1">From a shared frustration with clunky educational tools, the idea for EduZone was born. We envisioned a single, seamless platform for teachers and students.</p>
                        </div>
                    </div>
                </div>

                 {/* Timeline Item 2 */}
                <div className="relative md:flex md:items-center">
                    <div className="md:w-1/2 md:ml-[50%] md:pl-12">
                        <div className="relative p-6 bg-background rounded-lg shadow-md">
                            <div className="absolute -left-9 top-1/2 -translate-y-1/2">
                               <div className="bg-primary h-4 w-4 rounded-full border-4 border-secondary"></div>
                            </div>
                            <h3 className="font-bold text-lg">2023 - First Launch</h3>
                            <p className="text-sm text-muted-foreground mt-1">We launched our beta platform to a select group of pioneering schools, gathering invaluable feedback and refining our vision with real-world insights.</p>
                        </div>
                    </div>
                </div>

                {/* Timeline Item 3 */}
                <div className="relative md:flex md:items-center md:justify-end md:text-right">
                    <div className="md:w-1/2 md:pr-12">
                         <div className="relative p-6 bg-background rounded-lg shadow-md">
                            <div className="absolute -left-9 top-1/2 -translate-y-1/2 md:left-auto md:-right-9">
                               <div className="bg-primary h-4 w-4 rounded-full border-4 border-secondary"></div>
                            </div>
                            <h3 className="font-bold text-lg">2024 - AI Integration</h3>
                            <p className="text-sm text-muted-foreground mt-1">Introducing our AI-powered assistant to help teachers create more engaging content, from lesson plans to quiz questions, in a fraction of the time.</p>
                        </div>
                    </div>
                </div>

             </div>
          </div>
        </div>
      </section>
      
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-10 font-headline">A Glimpse into EduZone</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Image src="https://placehold.co/400x400.png" alt="Students in a modern classroom" width={400} height={400} className="rounded-lg object-cover aspect-square" data-ai-hint="classroom students" />
              <Image src="https://placehold.co/400x400.png" alt="Teacher giving an online lecture" width={400} height={400} className="rounded-lg object-cover aspect-square md:mt-8" data-ai-hint="teacher lecture" />
              <Image src="https://placehold.co/400x400.png" alt="Student learning on a tablet" width={400} height={400} className="rounded-lg object-cover aspect-square" data-ai-hint="online learning" />
              <Image src="https://placehold.co/400x400.png" alt="Students collaborating on a project" width={400} height={400} className="rounded-lg object-cover aspect-square md:mt-8" data-ai-hint="student collaboration" />
           </div>
        </div>
      </section>
    </div>
  );
}
