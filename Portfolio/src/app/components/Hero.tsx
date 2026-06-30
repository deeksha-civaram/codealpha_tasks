import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Github, Linkedin, Download, ChevronDown } from "lucide-react";
import profileImage from "../../imports/1000418531.jpg";
import resumePDF from "../../imports/DOC-20260507-WA0032..pdf";

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-primary/30 shadow-xl shadow-primary/20">
            <img
              src={profileImage}
              alt="Civaram VijayKumar Deeksha"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-4xl md:text-6xl mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
        >
          Civaram VijayKumar Deeksha
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-xl md:text-2xl text-muted-foreground mb-4"
        >
          AI Undergraduate | Aspiring Machine Learning Engineer
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-lg md:text-xl text-primary mb-8"
        >
          Building intelligent solutions using AI, Machine Learning, and Data Analytics
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-wrap gap-4 justify-center mb-8"
        >
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => scrollToSection("contact")}
          >
            Get In Touch
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            asChild
          >
            <a href={resumePDF} download="Civaram_VijayKumar_Deeksha_Resume.pdf">
              <Download className="mr-2 h-5 w-5" />
              Download Resume
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex gap-4 justify-center"
        >
          <a
            href="https://www.linkedin.com/in/deeksha-civaram-327301318"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full border border-border hover:border-primary hover:bg-primary/10 transition-all"
          >
            <Linkedin className="h-6 w-6 text-primary" />
          </a>
          <a
            href="https://github.com/deeksha-civaram"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full border border-border hover:border-primary hover:bg-primary/10 transition-all"
          >
            <Github className="h-6 w-6 text-primary" />
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="h-8 w-8 text-primary" />
        </motion.div>
      </motion.div>
    </section>
  );
}
