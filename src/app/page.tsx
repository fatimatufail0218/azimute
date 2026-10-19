import SiteBackground from "@/components/SiteBackground";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProjectSection from "@/components/ProjectSection";
import PhotoJourney from "@/components/PhotoJourney";
import PerspectiveSpiral from "@/components/PerspectiveSpiral";
import EssenceSection from "@/components/EssenceSection";
import Residences from "@/components/Residences";
import OutdoorIntro from "@/components/OutdoorIntro";
import Spaces from "@/components/Spaces";
import Footer from "@/components/Footer";
import { ImageViewerProvider } from "@/components/ImageViewer";
import { interiors, outdoors } from "@/data/journeys";
import IntroScreen from "@/components/IntroScreen";

export default function Home() {
  return (
    <ImageViewerProvider>
      <IntroScreen />
      <SiteBackground />
      <Header />
      <main>
        <Hero />
        <ProjectSection />
        <PhotoJourney
          id="ambientes"
          label="01 / INTERIORES"
          nextHref="#perspectiva"
          slides={interiors}
        />
        <PerspectiveSpiral />
        <EssenceSection />
        <Residences />
        <OutdoorIntro />
        <PhotoJourney
          id="terracos"
          label="02 / A CÉU ABERTO"
          nextHref="#espacos"
          slides={outdoors}
          theme="dark"
        />
        <Spaces />
      </main>
      <Footer />
    </ImageViewerProvider>
  );
}