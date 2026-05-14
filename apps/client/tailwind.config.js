/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // All colors use CSS variables — switching .dark/.light on <html>
        // automatically flips every bg-*, text-*, border-* class in the app
        bg:             "var(--color-bg)",
        surface:        "var(--color-surface)",
        elevated:       "var(--color-elevated)",
        border:         "var(--color-border)",
        accent:         "var(--color-accent)",
        "accent-dark":  "var(--color-accent-dark)",
        "text-primary":   "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted":     "var(--color-text-muted)",
        success: "#3DD68C",
        danger:  "#FF4D4D",
        // compat aliases
        brand: "var(--color-accent)",
        card:  "var(--color-surface)",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-out",
        "slide-up":   "slideUp 0.25s ease-out",
        "bounce-dot": "bounceDot 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:   { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        bounceDot: { "0%, 60%, 100%": { transform: "translateY(0)" }, "30%": { transform: "translateY(-6px)" } },
      },
    },
  },
  plugins: [],
};


