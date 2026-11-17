import { motion } from 'framer-motion'
import { personalInfo, stats } from '../data/portfolio'

export default function About() {
  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="section-label">01. about me</p>
          <h2 className="section-title">About</h2>
          <div className="section-divider" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-400 leading-relaxed text-lg mb-6">
              {personalInfo.bio}
            </p>
            <p className="text-gray-500 leading-relaxed">
              When I'm not building products, I'm exploring new AI tooling, contributing
              to open-source, or documenting what I've learned. I thrive in fast-paced
              environments and enjoy turning complex problems into clean, scalable solutions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-5"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="card text-center group hover:border-violet-600/40 transition-colors duration-200"
              >
                <p className="text-4xl font-extrabold accent-text mb-2">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
