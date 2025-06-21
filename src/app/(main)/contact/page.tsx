import { ContactForm } from "@/components/contact-form";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Get in Touch</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
                <h2 className="text-2xl font-bold">Contact Information</h2>
                <div className="space-y-4 text-muted-foreground">
                    <div className="flex items-start gap-4">
                        <MapPin className="h-6 w-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold text-foreground">Our Office</h3>
                            <p>123 Education Lane, Learning City, 12345</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Mail className="h-6 w-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold text-foreground">Email Us</h3>
                            <p>support@eduzone.com</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Phone className="h-6 w-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold text-foreground">Call Us</h3>
                            <p>+1 (555) 123-4567</p>
                        </div>
                    </div>
                </div>
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.225569478648!2d-122.419415684681!3d37.77492957975811!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c4c772c67%3A0x894b32a9a50d276!2sSan%20Francisco%20City%20Hall!5e0!3m2!1sen!2sus!4v1625248557345!5m2!1sen!2sus" 
                        width="100%" 
                        height="100%" 
                        style={{border:0}} 
                        allowFullScreen={true}
                        loading="lazy"
                        title="Google Maps Location"
                    ></iframe>
                </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-8">Send us a message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
