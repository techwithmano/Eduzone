export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Privacy Policy</h1>
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
              <h2 className="font-bold text-2xl text-foreground">1. Introduction</h2>
              <p>
                Welcome to EduZone. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-bold text-2xl text-foreground">2. Information We Collect</h2>
              <p>
                We collect personal information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our products and services, when you participate in activities on the platform or otherwise when you contact us. The personal information we collect may include your name, email address, password, role (student, teacher, admin), and other similar information.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-bold text-2xl text-foreground">3. How We Use Your Information</h2>
              <p>
                We use personal information collected via our platform for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To facilitate account creation and logon process.</li>
                <li>To manage user accounts and provide our services.</li>
                <li>To send administrative information to you.</li>
                <li>To protect our Services and prevent fraud.</li>
                <li>To enforce our terms, conditions and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="font-bold text-2xl text-foreground">4. Will Your Information Be Shared With Anyone?</h2>
              <p>
                We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal information to third parties.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-bold text-2xl text-foreground">5. How We Keep Your Information Safe</h2>
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>
            </div>
            
            <div className="space-y-2">
              <h2 className="font-bold text-2xl text-foreground">6. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
