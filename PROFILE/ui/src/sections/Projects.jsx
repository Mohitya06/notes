import { motion } from 'framer-motion'
import { FiGithub, FiExternalLink } from 'react-icons/fi'
import { projects } from '../data/portfolio'

const statusStyle = {
  Live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Planned: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

export default function Projects() {
  return (
    <section id="projects" className="py-24 px-6 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="section-label">04. what I've built</p>
          <h2 className="section-title">Projects</h2>
          <div className="section-divider" />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="card flex flex-col hover:border-violet-600/40 transition-all duration-200 group"
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 text-xs rounded-full border ${statusStyle[project.status]}`}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs text-gray-700">{project.type}</span>
                </div>
                <div className="flex gap-3">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-white transition-colors"
                      aria-label="GitHub"
                    >
                      <FiGithub size={15} />
                    </a>
                  )}
                  {project.demo && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-white transition-colors"
                      aria-label="Live demo"
                    >
                      <FiExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>

              <h3 className="text-white font-semibold mb-2 group-hover:text-violet-400 transition-colors duration-200">
                {project.title}
              </h3>

              <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {project.tech.map((t, idx) => (
                  <span key={t} className="text-xs text-gray-600 font-mono">
                    {t}
                    {idx < project.tech.length - 1 && (
                      <span className="text-gray-800 ml-2">·</span>
                    )}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
