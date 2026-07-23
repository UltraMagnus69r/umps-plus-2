/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        ui0: 'var(--ui-space-0)',
        ui1: 'var(--ui-space-1)',
        ui2: 'var(--ui-space-2)',
        ui3: 'var(--ui-space-3)',
        ui4: 'var(--ui-space-4)',
        ui5: 'var(--ui-space-5)',
        ui6: 'var(--ui-space-6)',
        ui8: 'var(--ui-space-8)',
        ui10: 'var(--ui-space-10)',
        ui12: 'var(--ui-space-12)',
        ui16: 'var(--ui-space-16)',
      },
      transitionDuration: {
        'ui-enter': 'var(--ui-motion-duration-enter)',
        'ui-standard': 'var(--ui-motion-duration-standard)',
        'ui-emphasis': 'var(--ui-motion-duration-emphasis)',
      },
      transitionTimingFunction: {
        'ui-out': 'var(--ui-motion-ease-out)',
        'ui-out-soft': 'var(--ui-motion-ease-out-soft)',
      },
    },
  },
  plugins: [],
}
