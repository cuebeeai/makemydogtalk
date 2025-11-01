import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Effective Date: January 1, 2025
          </p>

          <div className="prose prose-sm max-w-none space-y-6">
            <p className="text-foreground">
              We value your privacy. This policy explains how we collect, use, and protect your information.
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li><strong>Account info:</strong> email address or login provider data when you sign in</li>
                <li><strong>Uploads:</strong> images, text prompts, and videos you create</li>
                <li><strong>Usage data:</strong> analytics, IP address, device type, browser version</li>
                <li><strong>Payment info:</strong> handled securely by Stripe; we never store card details</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">2. How We Use Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>To provide, improve, and personalize the AI video generation experience</li>
                <li>To process payments and manage your account</li>
                <li>To communicate with you (support, promotions, updates)</li>
                <li>To prevent misuse or abuse of the platform</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">3. Sharing Information</h2>
              <p className="text-foreground">
                We do not sell user data.
              </p>
              <p className="text-foreground">We may share limited data with:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Service providers (hosting, analytics, payment processing)</li>
                <li>Law enforcement if required by law</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">4. Data Retention</h2>
              <p className="text-foreground">
                Uploads and generated videos may be retained for a limited period to operate the service or show your dashboard history.
                You may request deletion by emailing <a href="mailto:support@makemydogtalk.com" className="text-primary hover:underline">support@makemydogtalk.com</a>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">5. Cookies</h2>
              <p className="text-foreground">
                We use cookies to maintain sessions and measure site performance. You can disable cookies in your browser.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">6. Security</h2>
              <p className="text-foreground">
                We implement reasonable safeguards but cannot guarantee absolute security of data transmitted over the internet.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">7. Children's Privacy</h2>
              <p className="text-foreground">
                Our service is not intended for children under 13.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">8. Updates</h2>
              <p className="text-foreground">
                We may update this policy periodically; the latest version will always be available on this page.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">9. Contact</h2>
              <p className="text-foreground">
                Questions about privacy? Contact us at <a href="mailto:support@makemydogtalk.com" className="text-primary hover:underline">support@makemydogtalk.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
