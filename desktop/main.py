import tkinter as tk
from tkinter import ttk, messagebox
import cv2
import numpy as np
from PIL import Image, ImageTk
import sys

class InvisibleCloakDesktopApp:
    """
    Upgraded Production-Grade Invisible Cloak Desktop Application.
    
    Features:
    1. Background-Aware Segmentation: Combines HSV color masking with background difference
       (cv2.absdiff) to prevent pre-existing background objects of the same color from disappearing.
    2. Robust Median Color Sampling: 7x7 neighborhood sampling filtering out desaturated pixels.
    3. Connected Component Seed Selection: Uses click coordinates to isolate the specific cloak component.
    4. Temporal Mask Tracking & Smoothing: Maintains tracking stability across frames to prevent flicker.
    5. Interactive Sliders: Live tuning for tolerance, sensitivity, smoothing, and tracking persistence.
    """
    def __init__(self, root):
        self.root = root
        self.root.title("Invisible Cloak Pro - Advanced Computer Vision Desktop")
        self.root.geometry("1200x780")
        self.root.minsize(1000, 650)
        self.root.configure(bg="#0f172a")

        # Application state variables
        self.cap = None
        self.is_camera_running = False
        self.is_invisible_mode = False
        self.is_selecting_color = False

        self.background_frame = None
        self.current_frame = None

        # HSV Color & Mask Tracking variables
        self.selected_hsv = None  # (H, S, V) median tuple
        self.selected_rgb_hex = "#64748b"
        self.hsv_ranges = None  # List of (lower_np, upper_np) tuples

        # Temporal Tracking variables
        self.prev_mask = None
        self.prev_centroid = None  # (cx, cy)
        self.tracking_lost_counter = 0

        # Click seed location
        self.last_click_coord = None  # (x, y)

        # Setup GUI & Controls
        self._setup_styles()
        self._build_gui()

        # Handle clean exit
        self.root.protocol("WM_DELETE_WINDOW", self.on_exit)

    def _setup_styles(self):
        """Configure modern dark theme styles using ttk."""
        style = ttk.Style()
        style.theme_use("clam")

        bg_dark = "#0f172a"
        panel_bg = "#1e293b"
        accent_indigo = "#6366f1"
        accent_emerald = "#10b981"
        accent_rose = "#f43f5e"
        text_light = "#f8fafc"

        style.configure("TFrame", background=bg_dark)
        style.configure("Panel.TFrame", background=panel_bg, relief="solid", borderwidth=1)

        style.configure("TLabel", background=bg_dark, foreground=text_light, font=("Segoe UI", 10))
        style.configure("Header.TLabel", background=bg_dark, foreground="#818cf8", font=("Segoe UI", 16, "bold"))
        style.configure("SubHeader.TLabel", background=panel_bg, foreground="#a5b4fc", font=("Segoe UI", 11, "bold"))
        style.configure("Panel.TLabel", background=panel_bg, foreground=text_light, font=("Segoe UI", 9))
        style.configure("Status.TLabel", background="#020617", foreground="#38bdf8", font=("Segoe UI", 10, "bold"), padding=6)

        style.configure("TButton", font=("Segoe UI", 9, "bold"), padding=6)
        style.map("TButton",
                  background=[("active", "#4f46e5"), ("!disabled", accent_indigo)],
                  foreground=[("!disabled", "#ffffff")])

        style.configure("Success.TButton", font=("Segoe UI", 9, "bold"), padding=6)
        style.map("Success.TButton",
                  background=[("active", "#059669"), ("!disabled", accent_emerald)],
                  foreground=[("!disabled", "#ffffff")])

        style.configure("Danger.TButton", font=("Segoe UI", 9, "bold"), padding=6)
        style.map("Danger.TButton",
                  background=[("active", "#e11d48"), ("!disabled", accent_rose)],
                  foreground=[("!disabled", "#ffffff")])

    def _build_gui(self):
        """Construct GUI layout: Header, Canvas, Control Sidebar, Sliders, and Instructions."""
        # Top Header
        header_frame = ttk.Frame(self.root)
        header_frame.pack(fill=tk.X, padx=15, pady=10)

        title_label = ttk.Label(header_frame, text="✨ Invisible Cloak Pro", style="Header.TLabel")
        title_label.pack(side=tk.LEFT)

        subtitle = ttk.Label(header_frame, text="Background-Aware & Temporal Tracking Computer Vision Engine", style="TLabel")
        subtitle.pack(side=tk.LEFT, padx=15)

        # Main Layout Container
        main_container = ttk.Frame(self.root)
        main_container.pack(fill=tk.BOTH, expand=True, padx=15, pady=5)

        # Left Column: Video Feed & Canvas
        left_frame = ttk.Frame(main_container)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))

        self.canvas_width = 720
        self.canvas_height = 540
        self.video_canvas = tk.Canvas(left_frame, width=self.canvas_width, height=self.canvas_height,
                                      bg="#020617", highlightthickness=2, highlightbackground="#334155")
        self.video_canvas.pack(fill=tk.BOTH, expand=True)

        self.video_canvas.bind("<Button-1>", self._on_canvas_click)

        self.status_label = ttk.Label(left_frame, text="Status: Camera Idle. Click '1. Start Camera' to begin.", style="Status.TLabel", anchor="center")
        self.status_label.pack(fill=tk.X, pady=(6, 0))

        # Right Column: Control Sidebar
        right_panel = ttk.Frame(main_container, style="Panel.TFrame", width=380)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=False, ipady=10, ipadx=10)

        # Scrollable / Organized Control Sections
        ctrl_header = ttk.Label(right_panel, text="🎛️ Primary Controls", style="SubHeader.TLabel")
        ctrl_header.pack(anchor="w", padx=15, pady=(10, 5))

        btn_grid = ttk.Frame(right_panel, style="Panel.TFrame")
        btn_grid.pack(fill=tk.X, padx=15, pady=5)

        self.btn_start_cam = ttk.Button(btn_grid, text="1. Start Camera", command=self.start_camera)
        self.btn_start_cam.pack(fill=tk.X, pady=3)

        self.btn_capture_bg = ttk.Button(btn_grid, text="2. Capture Background", command=self.capture_background)
        self.btn_capture_bg.pack(fill=tk.X, pady=3)

        self.btn_select_color = ttk.Button(btn_grid, text="3. Select Cloak Color", command=self.enable_color_selection)
        self.btn_select_color.pack(fill=tk.X, pady=3)

        self.btn_toggle_cloak = ttk.Button(btn_grid, text="4. Start Invisible Mode", style="Success.TButton", command=self.toggle_invisible_mode)
        self.btn_toggle_cloak.pack(fill=tk.X, pady=3)

        # Swatch & Utility Buttons
        util_frame = ttk.Frame(right_panel, style="Panel.TFrame")
        util_frame.pack(fill=tk.X, padx=15, pady=6)

        self.btn_reset = ttk.Button(util_frame, text="🔄 Reset", command=self.reset_all)
        self.btn_reset.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 3))

        self.btn_exit = ttk.Button(util_frame, text="❌ Exit", style="Danger.TButton", command=self.on_exit)
        self.btn_exit.pack(side=tk.RIGHT, expand=True, fill=tk.X, padx=(3, 0))

        color_info_frame = ttk.Frame(right_panel, style="Panel.TFrame")
        color_info_frame.pack(fill=tk.X, padx=15, pady=4)

        ttk.Label(color_info_frame, text="Selected Color:", style="Panel.TLabel").pack(side=tk.LEFT, padx=(0, 5))
        self.color_swatch = tk.Label(color_info_frame, text=" None ", bg=self.selected_rgb_hex, fg="#ffffff",
                                     font=("Segoe UI", 9, "bold"), width=14, relief="solid", bd=1)
        self.color_swatch.pack(side=tk.LEFT)

        # Separator
        ttk.Separator(right_panel, orient="horizontal").pack(fill=tk.X, padx=15, pady=8)

        # Advanced Tuning Sliders Section
        tune_header = ttk.Label(right_panel, text="⚙️ Computer Vision Tuning", style="SubHeader.TLabel")
        tune_header.pack(anchor="w", padx=15, pady=(0, 5))

        slider_frame = ttk.Frame(right_panel, style="Panel.TFrame")
        slider_frame.pack(fill=tk.X, padx=15, pady=2)

        # Slider 1: Color Tolerance
        ttk.Label(slider_frame, text="Color Tolerance (Hue Margin):", style="Panel.TLabel").pack(anchor="w")
        self.slider_tolerance = ttk.Scale(slider_frame, from_=5, to=40, value=18, command=self._update_hsv_ranges)
        self.slider_tolerance.pack(fill=tk.X, pady=(0, 4))

        # Slider 2: BG Difference Sensitivity
        ttk.Label(slider_frame, text="BG Difference Sensitivity:", style="Panel.TLabel").pack(anchor="w")
        self.slider_bg_diff = ttk.Scale(slider_frame, from_=10, to=60, value=25)
        self.slider_bg_diff.pack(fill=tk.X, pady=(0, 4))

        # Slider 3: Mask Smoothing (Blur)
        ttk.Label(slider_frame, text="Mask Edge Smoothing:", style="Panel.TLabel").pack(anchor="w")
        self.slider_smooth = ttk.Scale(slider_frame, from_=1, to=15, value=5)
        self.slider_smooth.pack(fill=tk.X, pady=(0, 4))

        # Slider 4: Tracking Persistence
        ttk.Label(slider_frame, text="Tracking Persistence (Frames):", style="Panel.TLabel").pack(anchor="w")
        self.slider_tracking = ttk.Scale(slider_frame, from_=0, to=10, value=4)
        self.slider_tracking.pack(fill=tk.X, pady=(0, 4))

        # Instructions Section
        ttk.Separator(right_panel, orient="horizontal").pack(fill=tk.X, padx=15, pady=8)
        inst_header = ttk.Label(right_panel, text="📋 User Workflow", style="SubHeader.TLabel")
        inst_header.pack(anchor="w", padx=15, pady=(0, 2))

        instructions_text = (
            "1. Click 'Start Camera'\n"
            "2. Step out of view & click 'Capture Background'\n"
            "3. Hold your cloak & click 'Select Cloak Color'\n"
            "4. Click directly on your cloak in the video feed\n"
            "5. Click 'Start Invisible Mode'!"
        )
        inst_label = ttk.Label(right_panel, text=instructions_text, style="Panel.TLabel", justify="left")
        inst_label.pack(anchor="w", padx=15, pady=2)

    def start_camera(self):
        """Initialize OpenCV Videocapture device safely."""
        if self.is_camera_running:
            self._set_status("Camera is already active.")
            return

        self._set_status("Initializing camera...")
        self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW if sys.platform.startswith('win') else cv2.CAP_ANY)

        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(0)

        if not self.cap.isOpened():
            messagebox.showerror("Webcam Error", "Failed to access webcam (Index 0).\nPlease verify device permissions and connection.")
            self._set_status("Error: Camera not found.")
            return

        self.is_camera_running = True
        self._set_status("Camera Running. Step out of frame and capture background.")
        self.btn_start_cam.configure(text="Stop Camera", command=self.stop_camera)
        self._video_loop()

    def stop_camera(self):
        """Stop camera stream and reset loop state."""
        self.is_camera_running = False
        self.is_invisible_mode = False
        self.is_selecting_color = False

        if self.cap:
            self.cap.release()
            self.cap = None

        self.btn_start_cam.configure(text="1. Start Camera", command=self.start_camera)
        self.btn_toggle_cloak.configure(text="4. Start Invisible Mode", style="Success.TButton")
        self.video_canvas.delete("all")
        self._set_status("Camera Stopped.")

    def capture_background(self):
        """Capture static background frame by median filtering across consecutive frames."""
        if not self.is_camera_running or self.current_frame is None:
            messagebox.showwarning("Warning", "Please start the camera first!")
            return

        self._set_status("Capturing background... Please move out of frame!")
        self.root.update()

        background_stack = []
        for _ in range(30):
            ret, frame = self.cap.read()
            if ret:
                frame = cv2.flip(frame, 1)
                background_stack.append(frame)
            cv2.waitKey(10)

        if len(background_stack) > 0:
            self.background_frame = np.median(background_stack, axis=0).astype(np.uint8)
            self._set_status("Background Captured! Step into frame with your cloak.")
            messagebox.showinfo("Background Captured", "Clean background saved successfully!\nYou can now step into frame with your cloak.")
        else:
            messagebox.showerror("Error", "Failed to capture background frames.")
            self._set_status("Background capture failed.")

    def enable_color_selection(self):
        """Enable interactive mouse click color picking."""
        if not self.is_camera_running:
            messagebox.showwarning("Warning", "Please start the camera first!")
            return

        self.is_selecting_color = True
        self._set_status("COLOR SELECTION: Click directly on your cloak in the camera feed!")

    def _on_canvas_click(self, event):
        """Sample median HSV around clicked point and initialize connected component seed."""
        if not self.is_selecting_color or self.current_frame is None:
            return

        canvas_w = self.video_canvas.winfo_width()
        canvas_h = self.video_canvas.winfo_height()
        frame_h, frame_w = self.current_frame.shape[:2]

        if canvas_w <= 0 or canvas_h <= 0:
            return

        click_x = int(event.x * (frame_w / canvas_w))
        click_y = int(event.y * (frame_h / canvas_h))

        click_x = max(3, min(frame_w - 4, click_x))
        click_y = max(3, min(frame_h - 4, click_y))
        self.last_click_coord = (click_x, click_y)

        # 7x7 pixel neighborhood ROI
        roi_bgr = self.current_frame[click_y - 3:click_y + 4, click_x - 3:click_x + 4]
        roi_hsv = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2HSV)

        # Robust sampling: Filter out low saturation (<30) or extreme dark (<30)
        hsv_flat = roi_hsv.reshape(-1, 3)
        valid_mask = (hsv_flat[:, 1] >= 30) & (hsv_flat[:, 2] >= 30)
        valid_hsv = hsv_flat[valid_mask]

        if len(valid_hsv) > 0:
            median_hsv = np.median(valid_hsv, axis=0)
        else:
            median_hsv = np.median(hsv_flat, axis=0)

        h, s, v = int(median_hsv[0]), int(median_hsv[1]), int(median_hsv[2])
        self.selected_hsv = (h, s, v)

        # BGR for RGB Swatch preview
        median_bgr = np.median(roi_bgr.reshape(-1, 3), axis=0).astype(int)
        b, g, r = median_bgr[0], median_bgr[1], median_bgr[2]
        self.selected_rgb_hex = f"#{r:02x}{g:02x}{b:02x}"

        self._recalculate_hsv_ranges()

        self.color_swatch.configure(bg=self.selected_rgb_hex, text=f"H:{h} S:{s} V:{v}")
        self.is_selecting_color = False
        self.prev_mask = None
        self.prev_centroid = (click_x, click_y)

        self._set_status(f"Color Selected! HSV: ({h}, {s}, {v}). Ready to start Invisible Mode!")
        messagebox.showinfo("Color Selected", f"Cloak color selected successfully!\nHHSV: ({h}, {s}, {v})\n\nClick 'Start Invisible Mode' to activate.")

    def _update_hsv_ranges(self, val):
        """Callback when tolerance slider moves."""
        if self.selected_hsv is not None:
            self._recalculate_hsv_ranges()

    def _recalculate_hsv_ranges(self):
        """Calculate HSV bounds supporting Red wrap-around and tolerance slider setting."""
        if self.selected_hsv is None:
            return

        h, s, v = self.selected_hsv
        hue_margin = int(self.slider_tolerance.get())

        sat_lower = max(35, s - 75)
        sat_upper = 255
        val_lower = max(35, v - 75)
        val_upper = 255

        lower_hue = h - hue_margin
        upper_hue = h + hue_margin

        ranges = []
        if lower_hue < 0:
            ranges.append((np.array([180 + lower_hue, sat_lower, val_lower]), np.array([180, sat_upper, val_upper])))
            ranges.append((np.array([0, sat_lower, val_lower]), np.array([upper_hue, sat_upper, val_upper])))
        elif upper_hue > 180:
            ranges.append((np.array([lower_hue, sat_lower, val_lower]), np.array([180, sat_upper, val_upper])))
            ranges.append((np.array([0, sat_lower, val_lower]), np.array([upper_hue - 180, sat_upper, val_upper])))
        else:
            ranges.append((np.array([lower_hue, sat_lower, val_lower]), np.array([upper_hue, sat_upper, val_upper])))

        self.hsv_ranges = ranges

    def toggle_invisible_mode(self):
        """Toggle invisible mode state."""
        if not self.is_camera_running:
            messagebox.showwarning("Warning", "Please start the camera first!")
            return

        if self.background_frame is None:
            messagebox.showwarning("Missing Background", "Please click 'Capture Background' first!")
            return

        if self.hsv_ranges is None:
            messagebox.showwarning("Missing Color", "Please click 'Select Cloak Color' and pick your cloth color first!")
            return

        self.is_invisible_mode = not self.is_invisible_mode

        if self.is_invisible_mode:
            self.btn_toggle_cloak.configure(text="⏸️ Pause Invisible Mode", style="Danger.TButton")
            self._set_status("✨ INVISIBLE MODE ACTIVE! BG-difference & Temporal Tracking Enabled.")
        else:
            self.btn_toggle_cloak.configure(text="4. Start Invisible Mode", style="Success.TButton")
            self._set_status("Invisible Mode Paused.")

    def reset_all(self):
        """Reset application state."""
        self.is_invisible_mode = False
        self.is_selecting_color = False
        self.background_frame = None
        self.hsv_ranges = None
        self.selected_hsv = None
        self.prev_mask = None
        self.prev_centroid = None
        self.last_click_coord = None
        self.selected_rgb_hex = "#64748b"

        self.color_swatch.configure(bg=self.selected_rgb_hex, text=" None ")
        self.btn_toggle_cloak.configure(text="4. Start Invisible Mode", style="Success.TButton")
        self._set_status("All settings reset. Capture background and select color to restart.")

    def _video_loop(self):
        """Continuous video capture loop."""
        if not self.is_camera_running or self.cap is None:
            return

        ret, frame = self.cap.read()
        if not ret:
            self._set_status("Warning: Frame read dropped.")
            self.root.after(30, self._video_loop)
            return

        frame = cv2.flip(frame, 1)
        self.current_frame = frame.copy()

        output_frame = frame.copy()

        if self.is_invisible_mode and self.background_frame is not None and self.hsv_ranges is not None:
            output_frame = self._process_invisible_cloak(frame)

        if self.is_selecting_color:
            cv2.putText(output_frame, "CLICK ON YOUR CLOAK TO SELECT COLOR", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2, cv2.LINE_AA)

        # Convert to PIL ImageTk
        frame_rgb = cv2.cvtColor(output_frame, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(frame_rgb)

        canvas_w = max(self.video_canvas.winfo_width(), 320)
        canvas_h = max(self.video_canvas.winfo_height(), 240)
        img_pil = img_pil.resize((canvas_w, canvas_h), Image.Resampling.BILINEAR)

        self.tk_image = ImageTk.PhotoImage(image=img_pil)
        self.video_canvas.create_image(0, 0, image=self.tk_image, anchor=tk.NW)

        self.root.after(30, self._video_loop)

    def _process_invisible_cloak(self, current_frame):
        """
        Advanced Computer Vision Pipeline:
        1. HSV Color Masking across defined ranges.
        2. Background Difference Masking (cv2.absdiff): Filters out same-colored background objects.
        3. Candidate Mask = Color Mask AND Foreground Mask.
        4. Connected Components: Select component closest to initial seed/previous centroid.
        5. Temporal Persistence & Smoothing: Maintains mask across frames.
        6. Bitwise Blending.
        """
        hsv = cv2.cvtColor(current_frame, cv2.COLOR_BGR2HSV)

        # 1. Color Mask Generation
        color_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for lower_b, upper_b in self.hsv_ranges:
            r_mask = cv2.inRange(hsv, lower_b, upper_b)
            color_mask = cv2.bitwise_or(color_mask, r_mask)

        # 2. Background Difference Masking
        bg_diff_sens = int(self.slider_bg_diff.get())
        diff = cv2.absdiff(current_frame, self.background_frame)
        gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        _, fg_mask = cv2.threshold(gray_diff, bg_diff_sens, 255, cv2.THRESH_BINARY)

        # 3. Combine Color Mask AND Foreground Motion Mask
        candidate_mask = cv2.bitwise_and(color_mask, fg_mask)

        # Morphological Noise Filtering
        kernel = np.ones((3, 3), np.uint8)
        candidate_mask = cv2.morphologyEx(candidate_mask, cv2.MORPH_OPEN, kernel, iterations=2)
        candidate_mask = cv2.morphologyEx(candidate_mask, cv2.MORPH_DILATE, kernel, iterations=1)

        # 4. Connected Components & Tracking Seed Selection
        final_mask = np.zeros_like(candidate_mask)
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(candidate_mask)

        min_area = 150  # Minimum cloak component area threshold
        target_label = -1

        # Reference centroid: Use previous centroid or initial click coordinate
        ref_cx, ref_cy = self.prev_centroid if self.prev_centroid else (current_frame.shape[1] // 2, current_frame.shape[0] // 2)

        min_dist = float('inf')
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if area >= min_area:
                cx, cy = centroids[i]
                dist = np.sqrt((cx - ref_cx)**2 + (cy - ref_cy)**2)
                if dist < min_dist:
                    min_dist = dist
                    target_label = i

        max_allowed_dist = 250  # Max jump allowed frame-to-frame
        if target_label != -1 and min_dist < max_allowed_dist:
            final_mask[labels == target_label] = 255
            self.prev_centroid = centroids[target_label]
            self.tracking_lost_counter = 0
        else:
            # Tracking temporarily lost: Use temporal persistence if enabled
            max_hold = int(self.slider_tracking.get())
            if self.prev_mask is not None and self.tracking_lost_counter < max_hold:
                final_mask = self.prev_mask.copy()
                self.tracking_lost_counter += 1
            else:
                self.tracking_lost_counter += 1

        # 5. Mask Smoothing & Gaussian Blur
        blur_val = int(self.slider_smooth.get())
        if blur_val % 2 == 0:
            blur_val += 1
        final_mask = cv2.GaussianBlur(final_mask, (blur_val, blur_val), 0)

        self.prev_mask = final_mask.copy()

        # 6. Bitwise Blending with Background
        mask_inv = cv2.bitwise_not(final_mask)
        bg_resized = cv2.resize(self.background_frame, (current_frame.shape[1], current_frame.shape[0])) if self.background_frame.shape != current_frame.shape else self.background_frame

        cloak_area = cv2.bitwise_and(bg_resized, bg_resized, mask=final_mask)
        person_area = cv2.bitwise_and(current_frame, current_frame, mask=mask_inv)

        output = cv2.add(cloak_area, person_area)
        return output

    def _set_status(self, text):
        """Update GUI status bar text."""
        self.status_label.configure(text=f"Status: {text}")

    def on_exit(self):
        """Clean application termination."""
        self.stop_camera()
        self.root.destroy()
        sys.exit(0)

def main():
    root = tk.Tk()
    app = InvisibleCloakDesktopApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
