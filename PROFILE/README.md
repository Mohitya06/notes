# Portfolio — Mohitya Pratap Singh Parihar

Personal developer portfolio built with **React.js** (UI) + **Node.js** (API).

## Folder Structure

```
PROFILE/
├── ui/     → React.js frontend (Vite + Tailwind CSS + Framer Motion)
└── api/    → Node.js backend (Express + Nodemailer)
```

## Quick Start

### 1. UI

```bash
cd ui
npm install
npm run dev
# → http://localhost:3000
```

### 2. API

```bash
cd api
npm install
cp .env.example .env
# Fill in your Gmail credentials in .env
npm run dev
# → http://localhost:5000
```

> The Vite dev server proxies `/api/*` requests to `localhost:5000` automatically.

## Before Going Live

- [ ] Update `linkedin` and `github` URLs in `ui/src/data/portfolio.js`
- [ ] Add your Gmail App Password to `api/.env`
- [ ] Add your profile photo (place in `ui/public/` and reference in Hero)
- [ ] Add `resume.pdf` to `ui/public/` for the Resume button

## Sections

| Section | File |
|---------|------|
| Hero | `ui/src/sections/Hero.jsx` |
| About | `ui/src/sections/About.jsx` |
| Skills | `ui/src/sections/Skills.jsx` |
| Experience | `ui/src/sections/Experience.jsx` |
| Projects | `ui/src/sections/Projects.jsx` |
| Contact | `ui/src/sections/Contact.jsx` |

All portfolio content lives in one place: `ui/src/data/portfolio.js`

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React.js 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Nodemailer |
| Icons | react-icons |

## Deployment Options

| Part | Platform |
|------|----------|
| UI | Vercel, Netlify, GitHub Pages |
| API | Railway, Render, Fly.io |

---

## 🚀 Deployment Guide

### **1. Frontend Deployment (UI)**

#### **Option A: Vercel (Recommended - Easiest)**
```bash
cd ui
npm install -g vercel
vercel
# Follow the prompts
# Your site will be live at: your-portfolio.vercel.app
```

#### **Option B: Netlify**
```bash
cd ui
npm run build
# Drag & drop the 'dist' folder to Netlify.com
# Or use CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### **Option C: GitHub Pages**
```bash
# Update vite.config.js:
# base: '/your-repo-name/'

cd ui
npm run build
# Push 'dist' folder to gh-pages branch
```

---

### **2. Backend Deployment (API)**

#### **Option A: Railway (Simplest)**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Add environment variables in Railway dashboard:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASSWORD=your-app-password
   ```
4. Deploy automatically

#### **Option B: Render**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub
4. Set environment variables
5. Deploy

#### **Option C: Fly.io**
```bash
npm install -g flyctl
flyctl auth login
flyctl launch
# Follow prompts, add env vars
flyctl deploy
```

---

### **3. Environment Setup (Critical)**

**For API `.env` file:**
```env
# Gmail Setup (Gmail App Password, not regular password)
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-16-char-app-password

# CORS (set to your frontend URL)
FRONTEND_URL=https://your-portfolio.vercel.app

# Node Environment
NODE_ENV=production
PORT=5000
```

**Get Gmail App Password:**
1. Enable 2FA on Gmail: [myaccount.google.com](https://myaccount.google.com)
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate app password for "Mail"
4. Use that 16-char password in `.env`

---

### **4. Update UI Configuration**

Edit `ui/src/data/portfolio.js`:
```javascript
// Update with your actual URLs
linkedin: "https://linkedin.com/in/your-profile",
github: "https://github.com/your-username",
email: "your-email@gmail.com"

// Update API endpoint (after you deploy backend)
const API_URL = "https://your-api.railway.app"; // or render/fly.io URL
```

Update `ui/vite.config.js` for API proxy (production):
```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
}
```

---

### **5. Connect UI to Deployed API**

In your Contact form component or service, update the API endpoint:
```javascript
// Instead of localhost:5000
const API_URL = 'https://your-deployed-api.com';

const response = await fetch(`${API_URL}/api/contact`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
```

---

### **6. Complete Deployment Checklist**

- [ ] Update portfolio data in `ui/src/data/portfolio.js`
- [ ] Add profile photo to `ui/public/`
- [ ] Add resume.pdf to `ui/public/`
- [ ] Deploy UI (Vercel/Netlify/GitHub Pages)
- [ ] Get Gmail App Password
- [ ] Deploy API (Railway/Render/Fly.io)
- [ ] Set environment variables on backend platform
- [ ] Update API URL in UI code
- [ ] Test contact form end-to-end
- [ ] Add custom domain (optional)

---

### **Recommended Quick Setup (15 minutes)**
1. **Frontend:** Deploy to **Vercel** (auto-deploys from GitHub)
2. **Backend:** Deploy to **Railway** (auto-deploys from GitHub)
3. **Result:** Full production portfolio live!
