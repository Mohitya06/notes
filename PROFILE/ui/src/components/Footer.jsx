import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'
import { personalInfo } from '../data/portfolio'

export default function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-gray-600 text-sm">
          © {new Date().getFullYear()} Mohitya Parihar · Built with React.js & Node.js
        </p>
        <div className="flex items-center gap-5">
          <a
            href={personalInfo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <FiGithub size={18} />
          </a>
          <a
            href={personalInfo.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-white transition-colors"
            aria-label="LinkedIn"
          >
            <FiLinkedin size={18} />
          </a>
          <a
            href={`mailto:${personalInfo.email}`}
            className="text-gray-600 hover:text-white transition-colors"
            aria-label="Email"
          >
            <FiMail size={18} />
          </a>
        </div>
      </div>
    </footer>
  )
}
