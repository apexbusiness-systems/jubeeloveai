# Jubee Love - Production Deployment Guide
**Last Updated:** November 16, 2025

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Platforms](#deployment-platforms)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Required Before Deployment

- [ ] Supabase project created and configured
- [ ] Environment variables documented
- [ ] Domain name registered (optional but recommended)
- [ ] SSL certificate ready (automatic with most platforms)
- [ ] Deployment platform account created
- [ ] Git repository accessible

### Configuration Files Review

- [ ] `.env.example` reviewed and copied to `.env`
- [ ] `public/_headers` security headers configured
- [ ] `public/robots.txt` updated with production domain
- [ ] `public/sitemap.xml` updated with production domain
- [ ] `vite.config.ts` optimizations verified

---

## Environment Setup

### 1. Create Production Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit with your production values
nano .env
```

### 2. Configure Environment Variables

**Required Variables:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**How to Get Supabase Credentials:**

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Reference ID → `VITE_SUPABASE_PROJECT_ID`

### 3. Validate Environment

```bash
# Test that environment variables are loaded
npm run build

# You should see no errors about missing environment variables
```

---

## Build Process

### Local Build & Test

```bash
# Install dependencies
npm install

# Run linting (optional but recommended)
npm run lint

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

### Build Output Verification

After `npm run build`, verify:

- [ ] `dist/` folder created
- [ ] No build errors
- [ ] Bundle sizes reasonable (<1MB per chunk)
- [ ] Service worker generated (`dist/sw.js`)
- [ ] Manifest generated (`dist/manifest.webmanifest`)
- [ ] All assets copied to `dist/`

Expected output:
```
dist/
├── assets/
│   ├── [various chunked JS files]
│   ├── index-[hash].css
│   └── [other assets]
├── index.html
├── manifest.webmanifest
├── sw.js
├── workbox-[hash].js
└── [icon files]
```

---

## Deployment Platforms

### Option 1: Netlify (Recommended)

**Why Netlify:**
- ✅ Automatic PWA support
- ✅ Free SSL certificates
- ✅ Easy environment variable management
- ✅ Automatic deployments from Git
- ✅ Excellent performance

**Deployment Steps:**

1. **Install Netlify CLI (optional):**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy via Web Interface:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Add environment variables in Site settings → Environment variables
   - Deploy!

3. **Deploy via CLI:**
   ```bash
   # Login
   netlify login

   # Initialize
   netlify init

   # Deploy
   netlify deploy --prod
   ```

4. **Configure _headers:**
   - Netlify automatically reads `public/_headers` ✅
   - No additional configuration needed

5. **Custom Domain (Optional):**
   - Go to Site settings → Domain management
   - Add custom domain
   - Netlify handles SSL automatically

### Option 2: Vercel

**Why Vercel:**
- ✅ Excellent performance
- ✅ Automatic HTTPS
- ✅ Easy Git integration
- ✅ Global CDN

**Deployment Steps:**

1. **Install Vercel CLI (optional):**
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Web Interface:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import from Git
   - Configure:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   - Add environment variables
   - Deploy!

3. **Deploy via CLI:**
   ```bash
   # Login
   vercel login

   # Deploy
   vercel --prod
   ```

4. **Configure Headers:**
   Create `vercel.json` in root:
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin-when-cross-origin"
           }
         ]
       }
     ]
   }
   ```

### Option 3: Cloudflare Pages

**Why Cloudflare Pages:**
- ✅ Global CDN included
- ✅ Unlimited bandwidth
- ✅ DDoS protection
- ✅ Fast edge network

**Deployment Steps:**

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Workers & Pages → Create application → Pages → Connect to Git
3. Configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add environment variables
5. Deploy!

### Option 4: Firebase Hosting

**Why Firebase Hosting:**
- ✅ Google infrastructure
- ✅ Good integration with other Firebase services
- ✅ Automatic SSL

**Deployment Steps:**

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase:**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Configure `firebase.json`:**
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "**",
           "headers": [
             {
               "key": "X-Frame-Options",
               "value": "DENY"
             },
             {
               "key": "X-Content-Type-Options",
               "value": "nosniff"
             }
           ]
         }
       ]
     }
   }
   ```

4. **Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## Post-Deployment Verification

### 1. Functionality Testing

**Basic Functionality:**
- [ ] Application loads successfully
- [ ] All pages accessible
- [ ] Images and assets load
- [ ] Forms work correctly
- [ ] Authentication works
- [ ] Data saves to Supabase

**PWA Functionality:**
- [ ] PWA install prompt appears (Chrome/Edge)
- [ ] Application works offline
- [ ] Service worker registered
- [ ] App can be added to home screen (mobile)

**Multi-Device Testing:**
- [ ] Desktop (Chrome, Firefox, Safari, Edge)
- [ ] Mobile (iOS Safari, Chrome Android)
- [ ] Tablet (iPad, Android tablet)

### 2. Performance Testing

**Run Lighthouse Audit:**
```bash
# Chrome DevTools → Lighthouse → Generate report
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+
- PWA: 100

**Or use CLI:**
```bash
npm install -g lighthouse
lighthouse https://your-domain.com --view
```

### 3. Security Verification

**Check Security Headers:**
1. Visit [securityheaders.com](https://securityheaders.com)
2. Enter your domain
3. Verify all headers are present

**Target Grade:** A or A+

**Check SSL:**
1. Visit [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)
2. Enter your domain
3. Verify SSL configuration

**Target Grade:** A or A+

### 4. SEO Verification

**Check robots.txt:**
```
https://your-domain.com/robots.txt
```

**Check sitemap:**
```
https://your-domain.com/sitemap.xml
```

**Submit to Search Engines:**
- Google Search Console: [search.google.com/search-console](https://search.google.com/search-console)
- Bing Webmaster Tools: [bing.com/webmasters](https://www.bing.com/webmasters)

### 5. PWA Installation Testing

**Android (Chrome):**
1. Visit site on mobile
2. Tap "Add to Home Screen" prompt
3. Verify app icon appears on home screen
4. Launch app
5. Verify standalone mode (no browser UI)

**iOS (Safari):**
1. Visit site on mobile
2. Tap Share button
3. Tap "Add to Home Screen"
4. Verify app icon appears
5. Launch app

**Desktop (Chrome/Edge):**
1. Visit site
2. Click install icon in address bar
3. Verify app installs
4. Launch installed app

---

## Monitoring & Maintenance

### Set Up Error Tracking

**Recommended: Sentry**

1. **Create Sentry Account:**
   - Go to [sentry.io](https://sentry.io)
   - Create new project

2. **Install Sentry:**
   ```bash
   npm install @sentry/react @sentry/vite-plugin
   ```

3. **Configure Sentry:**
   ```typescript
   // src/main.tsx
   import * as Sentry from "@sentry/react";

   if (import.meta.env.PROD) {
     Sentry.init({
       dsn: "your-sentry-dsn",
       integrations: [
         Sentry.browserTracingIntegration(),
         Sentry.replayIntegration(),
       ],
       tracesSampleRate: 1.0,
       replaysSessionSampleRate: 0.1,
       replaysOnErrorSampleRate: 1.0,
     });
   }
   ```

### Set Up Analytics

**Recommended: Plausible (Privacy-friendly)**

```html
<!-- Add to index.html -->
<script defer data-domain="your-domain.com" src="https://plausible.io/js/script.js"></script>
```

**Or use Google Analytics (if acceptable for privacy):**

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Monitor Uptime

**Recommended Services:**
- **UptimeRobot:** [uptimerobot.com](https://uptimerobot.com) (Free)
- **Pingdom:** [pingdom.com](https://www.pingdom.com) (Paid)
- **StatusCake:** [statuscake.com](https://www.statuscake.com) (Free tier)

### Regular Maintenance Tasks

**Weekly:**
- [ ] Check error logs
- [ ] Review analytics
- [ ] Monitor uptime

**Monthly:**
- [ ] Update dependencies (`npm update`)
- [ ] Run security audit (`npm audit`)
- [ ] Review performance metrics
- [ ] Check for broken links

**Quarterly:**
- [ ] Run full Lighthouse audit
- [ ] Review and update content
- [ ] Test on new devices/browsers
- [ ] Review security headers

---

## Troubleshooting

### Build Failures

**Error: "Missing environment variables"**
```bash
# Solution: Ensure .env file exists and has all required variables
cp .env.example .env
# Fill in your values
```

**Error: "Module not found"**
```bash
# Solution: Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

### Deployment Issues

**PWA not installing:**
- Verify HTTPS is enabled
- Check service worker registration in DevTools
- Ensure manifest is valid
- Check browser console for errors

**Assets not loading:**
- Check Content Security Policy headers
- Verify base path in vite.config.ts
- Check network tab for 404 errors

**Environment variables not working:**
- Remember to use `VITE_` prefix
- Rebuild after changing .env
- Check deployment platform environment variable settings

### Performance Issues

**Slow initial load:**
- Run Lighthouse audit
- Check bundle sizes
- Enable compression on server
- Use CDN for assets

**Service worker issues:**
- Clear service worker in DevTools
- Force refresh (Ctrl+Shift+R)
- Check service worker updates

---

## Support & Resources

### Documentation
- Vite: [vitejs.dev](https://vitejs.dev)
- React: [react.dev](https://react.dev)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- PWA: [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps/)

### Community
- React Discord: [discord.gg/react](https://discord.gg/react)
- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)

### Tools
- Lighthouse: [developers.google.com/web/tools/lighthouse](https://developers.google.com/web/tools/lighthouse)
- Security Headers: [securityheaders.com](https://securityheaders.com)
- SSL Test: [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)

---

## Rollback Procedure

If issues arise after deployment:

### Netlify
```bash
# View deployments
netlify deploy --list

# Rollback to previous deployment via web interface
# Site → Deploys → [Previous deploy] → Publish deploy
```

### Vercel
```bash
# Rollback via web interface
# Deployments → [Previous deployment] → Promote to Production
```

### Git Rollback
```bash
# Revert to previous commit
git revert HEAD
git push

# Force rollback (use cautiously)
git reset --hard <previous-commit-hash>
git push --force
```

---

## Checklist: First Deployment

- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] All functionality tested locally
- [ ] Deployment platform configured
- [ ] Environment variables set on platform
- [ ] Deploy to production
- [ ] Verify HTTPS works
- [ ] Test PWA installation
- [ ] Run Lighthouse audit
- [ ] Check security headers
- [ ] Test on multiple devices
- [ ] Set up error tracking
- [ ] Set up analytics
- [ ] Set up uptime monitoring
- [ ] Update DNS (if using custom domain)
- [ ] Submit sitemap to search engines
- [ ] Announce launch! 🎉

---

**Need Help?** Check the troubleshooting section or consult the audit report for detailed technical information.

**Ready to Deploy?** Follow the checklist above and you'll be live in minutes!

Good luck with your deployment! 🚀
