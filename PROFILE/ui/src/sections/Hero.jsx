import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiGithub, FiLinkedin, FiMail, FiArrowRight } from 'react-icons/fi'
import { personalInfo } from '../data/portfolio'
import profileImage from '../data/profile-image.jpg'

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setRoleIndex((i) => (i + 1) % personalInfo.roles.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center px-6"
    >
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-violet-400 font-mono text-sm mt-4"
            >
              Hi, I'm 👋
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4"
            >
              Mohitya
              <br />
              <span className="accent-text">Parihar</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-400 mb-6 h-8 overflow-hidden"
            >
              <span key={roleIndex} className="block animate-fade-in">
                {personalInfo.roles[roleIndex]}
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-gray-500 text-lg leading-relaxed mb-8 max-w-xl"
            >
              Building scalable full-stack applications with 4+ years of experience.
              Specialized in GenAI integrations, real-time systems, and enterprise
              platforms. Based in{' '}
              <span className="text-violet-400">Delhi NCR</span> — open to remote or
              onsite roles.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <a href="#projects" className="btn-primary flex items-center gap-2 text-sm">
                View Projects <FiArrowRight size={15} />
              </a>
              <a href="#contact" className="btn-secondary text-sm">
                Contact Me
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="flex items-center gap-6"
            >
              <a
                href={personalInfo.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <FiGithub size={21} />
              </a>
              <a
                href={personalInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <FiLinkedin size={21} />
              </a>
              <a
                href={`mailto:${personalInfo.email}`}
                className="text-gray-600 hover:text-white transition-colors"
                aria-label="Email"
              >
                <FiMail size={21} />
              </a>
              <span className="w-px h-5 bg-[#2a2a2a]" />
              <span className="text-gray-700 text-sm font-mono">
                {personalInfo.location}
              </span>
            </motion.div>
          </div>

          {/* Right - Profile Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden md:flex items-center justify-center"
          >
            {/* Outer glow circle */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/10 rounded-full blur-3xl" />

            {/* Animated rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-violet-500/20"
              style={{ width: '320px', height: '320px' }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-4 rounded-full border border-violet-600/10"
              style={{ width: '300px', height: '300px' }}
            />

            {/* Profile image */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-80 h-80 rounded-full overflow-hidden border-2 border-violet-600/50 shadow-2xl shadow-violet-600/20"
            >
              <img
                src={profileImage}
                alt="Mohitya Parihar"
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-700">
        <span className="text-xs font-mono tracking-widest">scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-gray-700 to-transparent" />
      </div>
    </section>
  )
}
