import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Effective Date: January 1, 2025
          </p>

          <div className="prose prose-sm max-w-none space-y-6">
            <p className="text-foreground">
              Welcome to MakeMyDogTalk.com ("we," "our," "us").
              By accessing or using our website, you agree to these Terms of Service ("Terms").
              If you do not agree, do not use the site.
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">1. Service Description</h2>
              <p className="text-foreground">
                MakeMyDogTalk.com allows users to upload images, enter text prompts, and generate short AI-created videos for entertainment and personal use.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>You must be at least 13 years old (or the minimum age required by law in your country).</li>
                <li>If under 18, you must have parent or guardian consent.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">3. User Content</h2>
              <p className="text-foreground">
                You retain ownership of your uploaded images, text, and other materials ("User Content").
                By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and process that content for the purpose of generating videos and operating the service.
              </p>
              <p className="text-foreground font-semibold">You agree not to upload or prompt content that:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Violates any law or third-party rights (copyright, trademark, privacy, etc.)</li>
                <li>Contains nudity, violence, hate speech, or otherwise inappropriate material</li>
                <li>Includes likenesses of other individuals without their consent</li>
              </ul>
              <p className="text-foreground">
                We reserve the right to remove or refuse content that violates these rules.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">4. AI-Generated Content</h2>
              <p className="text-foreground">
                Videos are produced by artificial intelligence and may not be accurate, realistic, or exactly match your expectations.
                All output is provided "as is" for entertainment purposes only.
              </p>
              <p className="text-foreground">You acknowledge that:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>AI results can vary with each generation.</li>
                <li>We make no guarantees about the accuracy, quality, or suitability of any generated video.</li>
                <li>Generated content may contain minor visual or audio inconsistencies.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">5. Payments & Credits</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>All purchases are final.</li>
                <li>Credits or video packs are non-refundable once a generation request is submitted.</li>
                <li>Prices and features are subject to change without notice.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">6. Generated Video License & Usage Rights</h2>
              <p className="text-foreground font-semibold">
                Ownership & License:
              </p>
              <p className="text-foreground">
                You retain all rights to the videos generated using our service ("Generated Videos").
                You may use Generated Videos for both personal and commercial purposes, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Social media content (Instagram, TikTok, YouTube, Facebook, etc.)</li>
                <li>Business advertisements and marketing materials</li>
                <li>Entertainment and creative projects</li>
                <li>Personal sharing with friends and family</li>
              </ul>
              <p className="text-foreground font-semibold mt-4">
                Prohibited Uses:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Using Generated Videos to defame, harass, or harm any individual or entity</li>
                <li>Creating content that impersonates real individuals without consent</li>
                <li>Using videos for illegal purposes or to violate any laws</li>
                <li>Distributing content that infringes on third-party rights</li>
                <li>Misrepresenting Generated Videos as non-AI content where disclosure is required by law</li>
              </ul>
              <p className="text-foreground font-semibold mt-4">
                User Responsibility & Disclaimers:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>You are solely responsible for how you use Generated Videos</li>
                <li>You must comply with all applicable laws, including advertising disclosure requirements</li>
                <li>We are not responsible for any consequences arising from your use of Generated Videos</li>
                <li>Generated Videos are clearly AI-created content and should be presented as such when required</li>
                <li>You indemnify and hold us harmless from any claims arising from your use of Generated Videos</li>
              </ul>
              <p className="text-foreground mt-4">
                <strong>Attribution:</strong> While not required, we appreciate (but do not mandate) credit to MakeMyDogTalk.com when sharing Generated Videos publicly.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">7. Intellectual Property</h2>
              <p className="text-foreground">
                All software, branding, designs, and other assets of MakeMyDogTalk.com are our property and may not be copied, modified, or resold.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
              <p className="text-foreground">
                To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the site or generated content.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">9. Termination</h2>
              <p className="text-foreground">
                We may suspend or terminate access at our discretion if you violate these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">10. Changes to Terms</h2>
              <p className="text-foreground">
                We may update these Terms from time to time. The latest version will always be available on this page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">11. Contact</h2>
              <p className="text-foreground">
                Questions? Contact us at <a href="mailto:makemydogtalk@gmail.com" className="text-primary hover:underline">makemydogtalk@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
