import { Briefcase } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Join Our Team</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              We are passionate about building the future of education. See how you can contribute to our mission.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Briefcase className="h-16 w-16 mx-auto text-primary mb-6" />
            <h2 className="text-3xl font-bold tracking-tighter mb-4 font-headline">No Open Positions... Yet!</h2>
            <p className="text-muted-foreground text-lg mb-4">
              Thank you for your interest in a career at EduZone. While we don't have any specific openings at the moment, we are always on the lookout for talented and passionate individuals.
            </p>
            <p className="text-muted-foreground">
              We encourage you to check back here for future opportunities. We believe in creating a team that is dedicated, innovative, and driven to make a difference in the world of education.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
