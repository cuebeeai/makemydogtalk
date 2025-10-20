import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HelloSection from "@/components/HelloSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import SampleVideos from "@/components/SampleVideos";
import Pricing from "@/components/Pricing";
import FeatureHighlights from "@/components/FeatureHighlights";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <HelloSection />
        <WhyChooseUs />
        <SampleVideos />
        <Pricing />
        <FeatureHighlights />
      </main>
      <Footer />
    </div>
  );
}
