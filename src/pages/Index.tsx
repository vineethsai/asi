import HeroSection from "@/components/home/HeroSection";
import ComponentsSection from "@/components/home/ComponentsSection"; 
import ArchitectureSection from "@/components/home/ArchitectureSection";
import ArchitectureGraphSection from "@/components/home/ArchitectureGraphSection";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ArchitectureGraphSection />
        <ArchitectureSection />
        <ComponentsSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
