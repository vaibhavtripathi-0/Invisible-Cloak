# ✨ Invisible Cloak - Computer Vision Portfolio Project

[![Python 3.8+](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](desktop/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](web/)
[![React 19](https://img.shields.io/badge/React-19.0+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](web/)
[![OpenCV](https://img.shields.io/badge/OpenCV-Computer_Vision-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](desktop/)

A production-grade, dual-target **Invisible Cloak Computer Vision Application** featuring both an **Upgraded Python Desktop Application** and a **Vercel-Ready Client-Side Web Application**.

---

## 📁 Repository Architecture

```
InvisibleCloak/
├── desktop/                # Python Desktop Application
│   ├── main.py             # OpenCV + NumPy + Tkinter engine
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Desktop guide
│
├── web/                    # Browser-Based Web Application
│   ├── package.json        # Node.js dependencies (React, Vite, TS)
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── utils/          # Client-side CV engine (cvEngine.ts)
│   │   ├── App.tsx         # Responsive UI & camera permission handler
│   │   └── index.css       # Glassmorphism design system
│   └── README.md           # Web & Vercel deployment guide
│
└── README.md               # Root documentation & theoretical CV guide
```

---

## 🔬 Computer Vision Innovations & Fixes

Unlike naive invisible cloak implementations that rely solely on simple HSV color ranges, this project implements advanced computer vision techniques to eliminate common real-world bugs:

### 1. 🛡️ Background-Aware Segmentation (False Positive Elimination)
* **Problem**: Standard HSV thresholding makes pre-existing objects in the background of the same color disappear!
* **Solution**: Combines **Color Masking** with **Background Difference Masking** (`cv2.absdiff` in Python / RGB euclidean distance in JS):
  $$\text{Final Mask} = \text{ColorMask} \land \text{ForegroundMotionMask}$$
  Pre-existing matching background objects stay visible; only newly introduced cloak regions become invisible.

### 2. 🎯 Robust Median Sampling & Red Hue Wrap-Around
* Samples a 7x7 neighborhood around user click coordinates using **median statistics** (filtering out desaturated pixels, specular highlights, and shadows).
* OpenCV Hue ranges from $0$ to $180$. **Red color** spans near $0..15$ and $165..180$. The algorithm detects wrap-around and splits the color range into dual bounds combined with bitwise OR.

### 3. 🧩 Connected Components & Seed Region Isolation
* Isolates connected components in the candidate mask (`cv2.connectedComponentsWithStats`).
* Automatically selects the specific blob closest to the user's initial click coordinate, preventing unrelated same-colored objects across the room from triggering.

### 4. 📈 Temporal Mask Tracking & Persistence
* Tracks the cloak centroid $(c_x, c_y)$ across consecutive frames.
* Holds previous mask state for $N$ frames if brief lighting fluctuations or fast movement cause temporary detection drops, preventing flickering.

---

## 🖥️ Desktop Application (Python + OpenCV)

### Setup & Execution
```bash
cd desktop
pip install -r requirements.txt
python main.py
```
* **Controls**: Start Camera, Capture Background, Select Cloak Color, Start Invisible Mode.
* **Sliders**: Real-time controls for Color Tolerance, Background Sensitivity, Mask Edge Blur, and Tracking Persistence.

---

## 🌐 Web Application (React + TypeScript)

### Setup & Local Server
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:3000` to test in your browser.

### Vercel Deployment
```bash
npm run build
```
Deploy the output `dist` directory directly to **Vercel** or **Netlify**.

---

## 🔒 Privacy & Safety Guarantee

* **100% Local Processing**: Web application processes video frames client-side inside browser memory using HTML5 Canvas APIs. Zero server API calls are made.
* **Strict Stream Permissions**: Requests video stream only (`{ video: true, audio: false }`). **Microphone access is never requested.**
* **HTTPS Context**: Camera permissions require localhost or HTTPS deployment.

---

## 📄 License
This project is open-source and intended for learning, teaching, and portfolio demonstration.
