import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiCalendar } from 'react-icons/fi'
import { experience } from '../data/portfolio'

export default function Experience() {
  const [active, setActive] = useState(0)

  return (
    <section id="experience" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="section-label">03. where I've worked</p>
          <h2 className="section-title">Experience</h2>
          <div className="section-divider" />
        </motion.div>

        <div className="mt-12 grid md:grid-cols-12 gap-8">
          {/* Timeline */}
          <div className="md:col-span-4">
            <div className="relative space-y-4">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-600/50 to-transparent hidden md:block" />

              {/* Timeline items */}
              {experience.map((job, i) => (
                <motion.button
                  key={job.id}
                  onClick={() => setActive(i)}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="relative w-full text-left group"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-3 w-14 h-14 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: active === i ? 1.2 : 1,
                        boxShadow: active === i
                          ? '0 0 20px rgba(139, 92, 246, 0.6)'
                          : '0 0 0px rgba(139, 92, 246, 0)'
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        active === i
                          ? 'bg-violet-500 ring-4 ring-violet-500/20'
                          : 'bg-gray-600 group-hover:bg-violet-400'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="pl-20 py-3 px-4 rounded-lg transition-all duration-300 group-hover:bg-[#1a1a1a]">
                    <div className={`text-sm font-medium transition-colors ${
                      active === i ? 'text-violet-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`}>
                      {job.duration}
                    </div>
                    <div className={`text-base font-bold transition-colors mt-1 ${
                      active === i ? 'text-white' : 'text-gray-300 group-hover:text-white'
                    }`}>
                      {job.company}
                    </div>
                    <div className={`text-sm transition-colors mt-0.5 ${
                      active === i ? 'text-violet-300' : 'text-gray-500 group-hover:text-gray-400'
                    }`}>
                      {job.role}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Job details */}
          <div className="md:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-violet-500/10 rounded-xl p-8"
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      {experience[active].role}
                    </h3>
                    {experience[active].current && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-3 py-1 bg-violet-600/20 text-violet-300 text-xs font-semibold rounded-full border border-violet-500/30 animate-pulse"
                      >
                        Currently Working
                      </motion.span>
                    )}
                  </div>

                  <p className="text-lg text-violet-400 font-semibold mb-4">
                    @ {experience[active].company}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-6 flex-wrap text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      <FiCalendar size={16} className="text-violet-400" />
                      {experience[active].duration}
                    </span>
                    <span className="flex items-center gap-2">
                      <FiMapPin size={16} className="text-violet-400" />
                      {experience[active].location}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-violet-500/20 to-transparent mb-6" />

                {/* Highlights */}
                <ul className="space-y-3 mb-8">
                  {experience[active].highlights.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex gap-3 text-gray-300 leading-relaxed group"
                    >
                      <span className="text-violet-500 mt-1 flex-shrink-0 text-lg group-hover:scale-125 transition-transform">
                        ▹
                      </span>
                      <span className="group-hover:text-white transition-colors">{item}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Tech stack */}
                <div>
                  <p className="text-sm font-semibold text-gray-400 mb-3">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {experience[active].tech.map((t, i) => (
                      <motion.span
                        key={t}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        className="skill-tag text-xs py-1 hover:bg-violet-600/30 hover:text-violet-300 transition-all"
                      >
                        {t}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
