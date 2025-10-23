import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Video } from "lucide-react";

export default function Examples() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Example Videos
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              See what amazing videos our community has created
            </p>
          </div>

          <Card className="p-16 text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Video className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">
                Coming Soon!
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                We're waiting for more amazing video submissions from our community. Check back soon to see creative examples!
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground italic">
                Have a great video to share? Send it to us at <a href="mailto:hello@makemydogtalk.com" className="text-primary hover:underline">hello@makemydogtalk.com</a>
              </p>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
