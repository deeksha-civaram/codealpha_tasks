import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { GraduationCap } from "lucide-react";

export function Education() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section id="education" className="py-20 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-12 text-center">
            <span className="text-primary">Education</span>
          </h2>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-card border border-border rounded-lg p-8 hover:border-primary transition-all hover:shadow-xl hover:shadow-primary/10"
          >
            <div className="flex items-start gap-6">
              <div className="p-4 rounded-lg bg-primary/10 shrink-0">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl mb-2">Bachelor of Technology (B.Tech)</h3>
                <p className="text-xl text-primary mb-3">Artificial Intelligence</p>
                <p className="text-muted-foreground">
                  Pursuing a comprehensive education in AI, Machine Learning, and Data Science with a focus on
                  practical applications and real-world problem-solving.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
