import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrainCircuit, Book, BarChart, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-background to-secondary">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Unlock Your Potential with EduZone
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    The ultimate platform for students and teachers to connect, learn, and grow. Create engaging courses, track progress, and access a world of resources.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/store">Explore Courses</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                alt="Hero"
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                data-ai-hint="learning collaboration"
              />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  EduZone provides a comprehensive suite of tools for both teachers and students.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Book className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Create & Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Teachers can effortlessly build courses with rich content, while students enjoy an intuitive and engaging learning experience.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <BarChart className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Track Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Monitor student performance with detailed analytics, grade submissions, and provide personalized feedback to help them improve.</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Shop Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Access a marketplace of digital products including notes, worksheets, and mock exams to supplement learning.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                What Our Users Say
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Hear from teachers and students who love using EduZone.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-8">
                <Card className="text-left">
                    <CardContent className="p-6">
                        <p className="mb-4">"EduZone has revolutionized how I manage my classroom. The AI-powered tools save me so much time!"</p>
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
                 <Card className="text-left">
                    <CardContent className="p-6">
                        <p className="mb-4">"As a student, having all my courses and assignments in one place is a game-changer. It's so easy to stay organized."</p>
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
                 <Card className="text-left">
                    <CardContent className="p-6">
                        <p className="mb-4">"The resource store is fantastic. I found the perfect study guides for my final exams. Highly recommended!"</p>
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
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-accent/10 text-accent-foreground px-3 py-1 text-sm font-medium" style={{ color: 'hsl(var(--accent))'}}>AI Powered</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">Enhance Your Courses with AI</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our GenAI assistant helps you craft compelling course descriptions that attract more students. Just provide a draft, and let our AI handle the rest, optimizing for engagement and clarity.
                </p>
              </div>
              <div className="flex justify-center">
                 <Image
                    src="https://placehold.co/600x400.png"
                    alt="AI Feature"
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
                Create an account today and explore all the features that EduZone has to offer.
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
