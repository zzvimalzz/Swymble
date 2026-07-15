import {
  Facts,
  FeaturedDatasets,
  Hero,
  Mission,
  ModulesPreview,
  Philosophy,
  Roadmap,
  Technology,
} from "@/features/home";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Facts />
      <Mission />
      <ModulesPreview />
      <FeaturedDatasets />
      <Technology />
      <Roadmap />
      <Philosophy />
    </>
  );
}
