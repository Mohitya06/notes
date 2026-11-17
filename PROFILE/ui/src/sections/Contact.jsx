import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi'
import { personalInfo } from '../data/portfolio'

const contactDetails = [
  {
    icon: FiMail,
    label: 'Email',
    value: personalInfo.email,
    href: `mailto:${personalInfo.email}`,
  },
  {
    icon: FiPhone,
    label: 'Phone',
    value: personalInfo.phone,
    href: `tel:${personalInfo.phone}`,
  },
  {
    icon: FiMapPin,
    label: 'Location',
    value: `${personalInfo.location} · ${personalInfo.availability}`,
    href: null,
  },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState(null) // null | 'success' | 'error'
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="section-label">05. get in touch</p>
          <h2 className="section-title">Contact</h2>
          <div className="section-divider" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-14">
          {/* Left — info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-400 leading-relaxed text-lg mb-10">
              I'm currently open to new opportunities — remote or onsite. Whether you
              have a project in mind, want to collaborate, or just want to say hi, my
              inbox is always open.
            </p>

            <div className="space-y-6">
              {contactDetails.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-violet-600/10 border border-violet-600/20 flex items-center justify-center group-hover:border-violet-600 transition-colors flex-shrink-0">
                    <Icon className="text-violet-400" size={16} />
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs mb-0.5">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        className="text-gray-300 text-sm hover:text-violet-400 transition-colors"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-gray-300 text-sm">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-gray-500 text-sm mb-2 block">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-gray-500 text-sm mb-2 block">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-gray-500 text-sm mb-2 block">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Hi Mohitya, I'd like to..."
                  className="input-field resize-none"
                />
              </div>

              {status === 'success' && (
                <p className="text-emerald-400 text-sm">
                  Message sent! I'll get back to you soon.
                </p>
              )}
              {status === 'error' && (
                <p className="text-red-400 text-sm">
                  Something went wrong. Please email me directly at{' '}
                  <a
                    href={`mailto:${personalInfo.email}`}
                    className="underline"
                  >
                    {personalInfo.email}
                  </a>
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <FiSend size={15} /> Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
