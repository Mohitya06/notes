const express = require('express')
const { body, validationResult } = require('express-validator')
const nodemailer = require('nodemailer')
const rateLimit = require('express-rate-limit')

const router = express.Router()

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests from this IP. Please try again later.' },
})

const validate = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 }),
]

router.post('/', contactLimiter, validate, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, email, message } = req.body

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const mailOptions = {
    from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    replyTo: email,
    subject: `Portfolio — New message from ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #7c3aed;">New Portfolio Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="background:#f4f4f4; padding: 12px; border-radius: 6px;">
          ${message.replace(/\n/g, '<br>')}
        </p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    res.json({ success: true })
  } catch (err) {
    console.error('Mail error:', err.message)
    res.status(500).json({ error: 'Failed to send message. Please try again.' })
  }
})

module.exports = router
