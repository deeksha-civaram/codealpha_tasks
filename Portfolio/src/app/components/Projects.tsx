import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const projects = [
  {
    title: "CommuteX",
    description: "Developed a Smart Vehicle Route Planner web app with secure authentication, OTP login, user dashboard, and an interactive route planning interface enabling smooth navigation and real-time user interaction.",
    techStack: ["React", "Node.js", "Authentication", "Maps API"],
    icon: "🚗",
  },
  {
    title: "AI Route Optimization System",
    description: "Developed a system to optimize delivery routes using graph algorithms.",
    techStack: ["Python", "Dijkstra Algorithm"],
    icon: "🚀",
  },
  {
    title: "Domestic Waste Management Detector",
    description: "Developed a household waste classification system to predict wet, dry, recyclable, or hazardous categories from waste attributes.",
    techStack: ["Python", "Machine Learning"],
    icon: "♻️",
  },
  {
    title: "SkillMatch (Ideation)",
    description: "AI Opportunity Matching Platform - Designed a concept for an AI-powered system that matches learners with opportunities based on verified skills.",
    techStack: ["AI/ML", "Skill Matching", "Opportunity Matching"],
    icon: "🎯",
  },
];

export function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="projects" className="py-20 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-12 text-center">
            Featured <span className="text-primary">Projects</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="h-full bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="text-5xl mb-4">{project.icon}</div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
