# 🌐 Invisible Cloak Web (Client-Side Computer Vision)

A responsive, Vercel-ready browser-based **Invisible Cloak** computer vision application built with **React**, **TypeScript**, **Vite**, and **HTML5 Canvas Web APIs**.

---

## 🌟 Highlights

* **100% Client-Side Processing**: Real-time image processing runs directly inside your browser memory using HTML5 Canvas & Web Media API. No video data ever leaves your device.
* **Camera Permission Safety**: Explicit "Allow Camera & Start" user activation, strict video-only stream (`{ video: true, audio: false }`), and graceful handling of denied/unavailable cameras.
* **Background-Aware Segmentation**: Combines HSV color masking with background frame difference to prevent pre-existing matching objects from disappearing.
* **Vercel Ready**: Static single-page web app structure optimized for instant deployment on Vercel or Netlify.

---

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build for Production & Vercel Deployment

### 1. Build Static Output
```bash
npm run build
```

### 2. Deploy to Vercel
Simply import this repository or the `web/` folder into Vercel. 
* **Build Command**: `npm run build`
* **Output Directory**: `dist`

*Note: Browsers require an **HTTPS** context (or `localhost`) to enable camera access (`navigator.mediaDevices.getUserMedia`). Vercel provides HTTPS out of the box.*
