# 🚀 Modern Portfolio Website

A beautiful, responsive portfolio website built with React, TypeScript, and Tailwind CSS. Features a dark theme, smooth animations, blog system, and optimized SEO.

![Portfolio Preview](https://img.shields.io/badge/Live-yananer.dev-blue?style=for-the-badge&logo=vercel)

## ✨ Features

- 🎨 **Modern Design** - Clean, dark theme with smooth animations
- 📱 **Fully Responsive** - Perfect on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development
- 📝 **Blog System** - Markdown-based blog with frontmatter support
- 🔍 **SEO Optimized** - Meta tags, Open Graph, and Twitter Cards
- 🚀 **Auto Deployment** - GitHub Actions deployment to GitHub Pages
- 🎯 **TypeScript** - Type-safe development
- 💫 **Framer Motion** - Smooth page transitions and animations
- 📧 **Contact Form** - EmailJS integration for contact functionality

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **Blog**: Markdown with gray-matter
- **Email**: EmailJS
- **Deployment**: GitHub Pages with GitHub Actions
- **Icons**: Heroicons, Devicons

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/portfolio-website.git
   cd portfolio-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
📦 portfolio-website/
├── 🔧 .github/workflows/
│   └── deploy.yml              # GitHub Actions deployment
├── 📱 src/
│   ├── components/
│   │   ├── grids/              # Portfolio section components
│   │   │   ├── AboutMe.tsx     # About section
│   │   │   ├── Education.tsx   # Education section
│   │   │   ├── TechStack.tsx   # Tech skills section
│   │   │   └── WorkExperience.tsx # Work experience
│   │   ├── EmailPopup.tsx      # Contact form modal
│   │   ├── Footer.tsx          # Site footer
│   │   └── Header.tsx          # Navigation header
│   ├── pages/
│   │   ├── Home.tsx           # Homepage with grid layout
│   │   ├── Blog.tsx           # Blog listing page
│   │   └── BlogPost.tsx       # Individual blog post page
│   ├── types/
│   │   └── blog.ts            # TypeScript types
│   ├── utils/
│   │   └── blog.ts            # Blog loading utilities
│   ├── assets/                # Images and files
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── 📝 public/
│   ├── blog/                 # Markdown blog posts
│   │   ├── blog1.md
│   │   └── blog2.md
│   └── robots.txt           # SEO robots file
├── ⚙️ index.html             # HTML template with SEO meta tags
├── 📋 package.json           # Dependencies and scripts
├── 🎨 tailwind.config.js     # Tailwind configuration
├── ⚙️ vite.config.ts         # Vite configuration
└── 📖 README.md             # This file
```

## 🎨 Customization Guide

### 1. Personal Information

**Update About Me Section** (`src/components/grids/AboutMe.tsx`):
```typescript
// Replace with your information
<h2 className="text-2xl font-bold text-white font-manrope">Your Name</h2>
<p className="text-indigo-400 text-lg">Your Title/Role</p>
```

**Update Profile Photo**:
- Replace `src/assets/your-photo.jpg` with your photo
- Update the import in `AboutMe.tsx`

### 2. SEO & Meta Tags

**Update SEO Information** (`index.html`):
```html
<title>Your Name - Your Title</title>
<meta name="description" content="Your description here..." />
<meta name="keywords" content="Your, Keywords, Here" />
<meta property="og:title" content="Your Name - Your Title" />
```

### 3. Work Experience

**Update Work History** (`src/components/grids/WorkExperience.tsx`):
```typescript
const experiences = [
  {
    company: "Your Company",
    role: "Your Role",
    duration: "Duration",
    description: "What you did...",
    technologies: ["Tech1", "Tech2"]
  }
]
```

### 4. Education

**Update Education** (`src/components/grids/Education.tsx`):
```typescript
<h3 className="text-lg font-bold text-white">Your Degree</h3>
<p className="text-indigo-400">Your University</p>
<span className="text-gray-400 text-sm">Graduation Year</span>
```

### 5. Tech Stack

**Update Skills** (`src/components/grids/TechStack.tsx`):
```typescript
const technologies = [
  { name: "Your Tech", icon: "your-icon-class" }
]
```

### 6. Blog Posts

**Create New Blog Posts**:
1. Add `.md` files to `public/blog/`
2. Include frontmatter:
```markdown
---
title: "Your Blog Post Title"
date: "2024-01-01"
description: "Post description"
tags: ["tag1", "tag2"]
---

Your blog content here...
```

### 7. Contact Form (EmailJS)

**Setup EmailJS**:
1. Create account at [EmailJS](https://www.emailjs.com/)
2. Set up email service and template
3. Add GitHub Secrets:
   - `VITE_EMAILJS_PUBLIC_KEY`
   - `VITE_EMAILJS_SERVICE_ID` 
   - `VITE_EMAILJS_TEMPLATE_ID`

### 8. Colors & Styling

**Update Color Scheme** (`tailwind.config.js`):
```javascript
theme: {
  extend: {
    colors: {
      // Add your custom colors
      primary: '#your-color',
      secondary: '#your-color'
    }
  }
}
```

## 🚀 Deployment

### GitHub Pages (Recommended)

1. **Fork this repository**
2. **Update GitHub repository settings**:
   - Go to Settings → Pages
   - Source: GitHub Actions
3. **Add EmailJS secrets** (if using contact form):
   - Go to Settings → Secrets and Variables → Actions
   - Add the EmailJS environment variables
4. **Push to main branch** - Auto-deploys via GitHub Actions

### Custom Domain

1. **Add CNAME file** to `public/` with your domain
2. **Update GitHub Pages settings** to use custom domain
3. **Configure DNS** to point to GitHub Pages

### Alternative Deployments

- **Vercel**: Connect GitHub repo and deploy
- **Netlify**: Drag and drop `dist/` folder or connect repo
- **Cloudflare Pages**: Connect GitHub repo

## 📋 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run deploy       # Deploy to GitHub Pages (manual)
```

## 🔧 Configuration Files

### Vite Configuration (`vite.config.ts`)
- Build settings and optimization
- Path aliases
- Plugin configuration

### Tailwind Configuration (`tailwind.config.js`)
- Custom colors and fonts
- Typography plugin settings
- Content paths

### TypeScript Configuration (`tsconfig.json`)
- Compiler options
- Path mappings
- Build settings

## 🐛 Troubleshooting

### Common Issues

**Blog posts not loading**:
- Ensure markdown files are in `public/blog/`
- Check frontmatter format
- Verify file extensions are `.md`

**Build fails**:
- Run `npm install` to ensure dependencies
- Check for TypeScript errors
- Verify all imports are correct

**Deployment fails**:
- Check GitHub Actions logs
- Verify environment variables are set
- Ensure `main` branch is up to date

## 📚 Learning Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Design inspiration from modern portfolio websites
- Icons from [Heroicons](https://heroicons.com/) and [Devicons](https://devicon.dev/)
- Fonts from [Google Fonts](https://fonts.google.com/)

## 📞 Support

If you have any questions or need help customizing this template:

- 📧 Open an issue on GitHub
- 💬 Start a discussion in the Discussions tab
- ⭐ Star the repository if you found it helpful!

---

**Made with ❤️ by [Umut Dinçer Yananer](https://yananer.dev)**

> This template is open source and free to use. If you create something awesome with it, I'd love to see it!
