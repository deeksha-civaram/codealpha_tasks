import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { Code2, Brain, Wrench, Globe } from "lucide-react";

const skillCategories = [
  {
    title: "Programming",
    icon: Code2,
    skills: ["Python", "Java", "SQL"],
  },
  {
    title: "AI/ML",
    icon: Brain,
    skills: ["Machine Learning", "Natural Language Processing (NLP)"],
  },
  {
    title: "Tools",
    icon: Wrench,
    skills: ["Power BI", "Microsoft Excel"],
  },
  {
    title: "Web Development",
    icon: Globe,
    skills: ["HTML", "CSS", "JavaScript"],
  },
];

export function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="skills" className="py-20 px-6 bg-card/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-12 text-center">
            Technical <span className="text-primary">Skills</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skillCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl">{category.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {category.skills.map((skill) => (
                      <li key={skill} className="text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {skill}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
