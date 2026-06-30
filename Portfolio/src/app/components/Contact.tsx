import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { Mail, Linkedin, Github, Send } from "lucide-react";
import { Button } from "./ui/button";

export function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section id="contact" className="py-20 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-4 text-center">
            Let's <span className="text-primary">Connect</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            I'm always open to discussing new opportunities and collaborations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.a
              href="mailto:civaramdeeksha@gmail.com"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              whileHover={{ y: -5 }}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 flex flex-col items-center text-center group"
            >
              <div className="p-4 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 group-hover:text-primary transition-colors">Email</h3>
              <p className="text-sm text-muted-foreground break-all">civaramdeeksha@gmail.com</p>
            </motion.a>

            <motion.a
              href="https://www.linkedin.com/in/deeksha-civaram-327301318"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              whileHover={{ y: -5 }}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 flex flex-col items-center text-center group"
            >
              <div className="p-4 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Linkedin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 group-hover:text-primary transition-colors">LinkedIn</h3>
              <p className="text-sm text-muted-foreground">Connect with me</p>
            </motion.a>

            <motion.a
              href="https://github.com/deeksha-civaram"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              whileHover={{ y: -5 }}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 flex flex-col items-center text-center group"
            >
              <div className="p-4 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Github className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 group-hover:text-primary transition-colors">GitHub</h3>
              <p className="text-sm text-muted-foreground">View my projects</p>
            </motion.a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center"
          >
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => window.location.href = 'mailto:civaramdeeksha@gmail.com'}
            >
              <Send className="mr-2 h-5 w-5" />
              Send a Message
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
