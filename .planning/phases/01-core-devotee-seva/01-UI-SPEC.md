# Phase 1 UI Design Contract: Core Devotee & Seva

## 1. Design System & Brand
- **Style**: Glassmorphism (backdrop-filter, semi-transparent backgrounds).
- **Colors**: Deep traditional saffron/maroon accents for branding, over a clean light/dark glassmorphic background.
- **Typography**: System sans-serif (e.g., Inter) for English. Clear Unicode support for Kannada.

## 2. Layout & Spacing
- **Container**: Max-width constraints on desktop, edge-to-edge on mobile.
- **Spacing**: Tailwind standard spacing (e.g., `p-4`, `gap-6`, `m-2`).
- **Cards**: Major forms (Booking, Devotee Profile) should be within glassmorphic cards (`bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg`).

## 3. Key Components
- **Universal Auto-Complete Bar**: A prominent, large input field at the top of the booking view. Must clearly show dropdown matches.
- **Voice Dictation Mic**: An inline mic icon inside input fields, pulsing with Framer Motion when active.
- **Language Toggle**: A simple EN/KN switch in the global header.

## 4. Typography & Copywriting
- **Labels**: Clear, semi-bold labels above inputs.
- **Helper Text**: Simple, jargon-free language explaining what each field expects.

## 5. Interactions & States
- **Loading**: Framer motion fade-in/fade-out for skeleton loaders.
- **Empty States**: Friendly message with a relevant icon (e.g., "No devotees found. Add a new one?").
- **Success/Error**: Toast notifications using matching glassmorphism styling.
