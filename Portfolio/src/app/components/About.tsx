import { motion } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";

export function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="about" className="py-20 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-8 text-center">
            About <span className="text-primary">Me</span>
          </h2>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              I am an Artificial Intelligence undergraduate with a strong interest in building intelligent,
              data-driven solutions to real-world problems. My academic journey has equipped me with a solid
              foundation in machine learning, data structures, and algorithmic thinking.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              I enjoy working on projects that combine problem-solving with practical implementation, such as
              developing predictive models, optimizing systems, and creating data visualization dashboards.
              My experience includes working with Python, SQL, and tools like Power BI to analyze data and
              extract meaningful insights.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              I am particularly interested in{" "}
              <span className="text-primary">Machine Learning</span>,{" "}
              <span className="text-primary">Natural Language Processing</span>, and{" "}
              <span className="text-primary">Data Analytics</span>, and I continuously explore new
              technologies to enhance my skills.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              I have completed multiple certifications from Google Cloud, Infosys, and Simplilearn,
              strengthening my understanding of AI concepts and real-world applications.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="text-foreground"
            >
              Beyond technical skills, I value <span className="text-primary">teamwork</span>,{" "}
              <span className="text-primary">adaptability</span>, and{" "}
              <span className="text-primary">continuous learning</span>. My goal is to contribute to
              impactful AI-driven solutions.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
