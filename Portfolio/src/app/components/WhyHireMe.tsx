import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { Lightbulb, Target, Users, TrendingUp, Zap } from "lucide-react";

const reasons = [
  {
    icon: Lightbulb,
    title: "Strong AI & ML Foundation",
    description: "Solid understanding of machine learning algorithms and artificial intelligence concepts",
  },
  {
    icon: Target,
    title: "Hands-on Project Experience",
    description: "Real-world experience building AI systems and data-driven solutions",
  },
  {
    icon: Zap,
    title: "Problem-Solving Skills",
    description: "Strong analytical thinking and ability to solve complex technical challenges",
  },
  {
    icon: TrendingUp,
    title: "Quick Learner",
    description: "Adaptable and eager to learn new technologies and methodologies",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Excellent teamwork and leadership mindset for collaborative projects",
  },
];

export function WhyHireMe() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="why-hire-me" className="py-20 px-6 bg-card/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-12 text-center">
            Why <span className="text-primary">Hire Me?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasons.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -5 }}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl mb-2">{reason.title}</h3>
                  <p className="text-muted-foreground">{reason.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
