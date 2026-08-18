# ✨ Invisible Cloak Desktop (Python + OpenCV)

An advanced, production-quality desktop computer vision application in Python built with **OpenCV**, **NumPy**, and **Tkinter**.

---

## 🌟 Advanced Computer Vision Features

1. **Background-Aware Segmentation**: Combines HSV color masking with background frame difference (`cv2.absdiff`). Objects of the same color that were present when the background was captured remain visible!
2. **Robust Median Sampling**: Interactive color picker samples a 7x7 pixel region using median statistics to ignore extreme highlights and desaturated pixels.
3. **Connected Components & Tracking Seed**: Isolates the cloak component closest to the initial click coordinates, preventing unrelated background objects from disappearing.
4. **Temporal Mask Tracking & Smoothing**: Remembers cloak location across frames, maintaining persistence and preventing flicker during fast movements.
5. **Interactive Controls & Sliders**: Live tuning sliders for Color Tolerance, Background Difference Sensitivity, Mask Smoothing, and Tracking Persistence.

---

## 🚀 Quick Start

### 1. Navigate to Desktop Directory
```bash
cd desktop
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Application
```bash
python main.py
```

---

## ⚙️ Computer Vision Pipeline

```
[ Webcam Frame ] ───────> Convert BGR to HSV ───────> Color Mask (inRange)
                                                             │
[ Background Frame ] ───> cv2.absdiff() & Threshold ──> FG Difference Mask
                                                             │
                                                   Bitwise AND (Combined Mask)
                                                             │
                                                   Connected Components (Seed Tracking)
                                                             │
                                                   Temporal Persistence & Blur
                                                             │
                                                   Bitwise Blend (Output)
```
