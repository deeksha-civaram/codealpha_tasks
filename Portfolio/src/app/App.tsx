import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Projects } from "./components/Projects";
import { Certifications } from "./components/Certifications";
import { Education } from "./components/Education";
import { WhyHireMe } from "./components/WhyHireMe";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Certifications />
      <Education />
      <WhyHireMe />
      <Contact />
      <Footer />
    </div>
  );
}