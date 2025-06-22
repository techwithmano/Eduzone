import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpenCheck, BarChart3, ShoppingBasket, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-background to-secondary">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 gap-y-8 gap-x-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Empowering Minds, One Click at a Time
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
                    Welcome to EduZone, the all-in-one platform where education meets innovation. We connect dedicated teachers with eager students to create dynamic, seamless, and truly effective learning environments.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/dashboard">Begin Your Journey</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/store">Explore Courses</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                alt="Students collaborating online"
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full"
                data-ai-hint="learning collaboration"
              />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A Smarter Way to Learn and Teach</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  EduZone is packed with powerful, intuitive tools designed to elevate the educational experience for everyone.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <BookOpenCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Unified Classroom</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground">Teachers can effortlessly manage assignments, quizzes, and materials. Students get a single, organized hub for all their coursework.</p>
                </CardContent>
              </Card>
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Track Progress</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground">Monitor student performance with insightful analytics, grade submissions, and provide personalized feedback to drive improvement.</p>
                </CardContent>
              </Card>
               <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <ShoppingBasket className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Resource Marketplace</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground">Access a curated store of digital notes, expert-led courses, and mock exams to supplement learning and accelerate success.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Loved by Educators and Students Alike
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Hear from members of our growing community who are transforming their educational journey with EduZone.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-8">
                <Card className="text-left flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                        <p className="mb-4 flex-1">"EduZone has revolutionized how I manage my classroom. The tools are intuitive and save me so much time, allowing me to focus more on my students."</p>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src="https://placehold.co/40x40.png" />
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Jane Doe</p>
                                <p className="text-sm text-muted-foreground">High School Teacher</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="text-left flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                        <p className="mb-4 flex-1">"As a student, having all my courses and assignments in one place is a game-changer. It's so easy to stay organized and on top of my work."</p>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src="https://placehold.co/40x40.png" />
                                <AvatarFallback>JS</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">John Smith</p>
                                <p className="text-sm text-muted-foreground">University Student</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="text-left flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                        <p className="mb-4 flex-1">"The resource store is fantastic. I found the perfect study guides for my final exams, created by teachers I trust. Highly recommended!"</p>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src="https://placehold.co/40x40.png" />
                                <AvatarFallback>SA</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Sarah Adams</p>
                                <p className="text-sm text-muted-foreground">College Student</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-medium">AI Powered</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">Create Content, Smarter</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Leverage our GenAI assistant to craft compelling course descriptions, generate quiz questions, and create lesson plans. Save time and boost engagement with AI-driven content creation.
                </p>
              </div>
              <div className="flex justify-center">
                 <Image
                    src="https://placehold.co/600x400.png"
                    alt="AI assistant helping a teacher"
                    width={600}
                    height={400}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                    data-ai-hint="artificial intelligence robot"
                 />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Ready to Join the Future of Education?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Create your free account today and unlock a world of powerful tools for teaching and learning.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild className="w-full" size="lg">
                <Link href="/auth">Sign Up Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
