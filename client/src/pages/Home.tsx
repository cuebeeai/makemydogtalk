import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UseCases from "@/components/UseCases";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <main className="flex-1">
        <Hero />
        <UseCases />
      </main>
      <Footer />
    </div>
  );
}
