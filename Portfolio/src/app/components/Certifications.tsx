import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { Award } from "lucide-react";

const certifications = [
  {
    title: "Prompt Engineering",
    issuer: "Simplilearn",
    category: "AI",
  },
  {
    title: "Deloitte Data Analytics Job Simulation",
    issuer: "Deloitte",
    category: "Analytics",
  },
  {
    title: "NLP Foundation Certification",
    issuer: "Infosys",
    category: "AI",
  },
  {
    title: "Prompt Design in Vertex AI",
    issuer: "Google Cloud",
    category: "AI",
  },
  {
    title: "Build Real World AI Applications with Gemini and Imagen",
    issuer: "Google Cloud",
    category: "AI",
  },
  {
    title: "Problem Solving (Basic)",
    issuer: "HackerRank",
    category: "Programming",
  },
  {
    title: "Data Structures Design and Algorithms",
    issuer: "NPTEL",
    category: "Programming",
  },
];

export function Certifications() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="certifications" className="py-20 px-6 bg-card/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-12 text-center">
            <span className="text-primary">Certifications</span> & Achievements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className="bg-card border border-border rounded-lg p-5 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 leading-tight">{cert.title}</h3>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {cert.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
