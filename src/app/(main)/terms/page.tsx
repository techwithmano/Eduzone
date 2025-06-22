export default function TermsOfServicePage() {
  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Terms of Service</h1>
             <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
              Last updated: June 22, 2024
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="space-y-8 text-muted-foreground">
            <div className="space-y-2">
                <h2 className="font-bold text-2xl text-foreground">1. Agreement to Terms</h2>
                <p>By using our services ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you do not have permission to access the Service. This is a legally binding agreement.</p>
            </div>
            <div className="space-y-2">
                <h2 className="font-bold text-2xl text-foreground">2. User Accounts</h2>
                <p>When you create an account with us, you guarantee that you are above the age of 13, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service. You are responsible for safeguarding the password that you use to access the Service.</p>
            </div>
             <div className="space-y-2">
                <h2 className="font-bold text-2xl text-foreground">3. User Content</h2>
                <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness. You retain any and all of your rights to any Content you submit, post or display on or through the Service.</p>
            </div>
             <div className="space-y-2">
                <h2 className="font-bold text-2xl text-foreground">4. Prohibited Uses</h2>
                <p>You may use the Service only for lawful purposes and in accordance with the Terms. You agree not to use the Service in any way that violates any applicable national or international law or regulation, or to engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service.</p>
            </div>
             <div className="space-y-2">
                <h2 className="font-bold text-2xl text-foreground">5. Termination</h2>
                <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
            </div>
             <div className="space-y-2">
                <h2 className="font-bold text-2xl text-foreground">6. Changes To Terms</h2>
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
