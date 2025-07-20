# BioPing Design System

## Overview

This document outlines the comprehensive design system for the BioPing platform, featuring modern UI/UX patterns, sophisticated animations, and a cohesive visual language.

## 🎨 Color Palette

### Primary Colors
- **Primary Blue**: `#3b82f6` (blue-600) - Main brand color
- **Primary Dark**: `#1e3a8a` (blue-900) - Sidebar and footer
- **Primary Light**: `#eff6ff` (blue-50) - Backgrounds

### Secondary Colors
- **Secondary Orange**: `#f59e0b` (orange-500) - Accent and highlights
- **Secondary Dark**: `#78350f` (orange-900) - Text accents

### Accent Colors
- **Success Green**: `#22c55e` (green-500) - Success states
- **Warning Yellow**: `#f59e0b` (yellow-500) - Warning states
- **Error Red**: `#ef4444` (red-500) - Error states

### Neutral Colors
- **Gray Scale**: Full range from 50-950 for text and backgrounds
- **White/Off-white**: Clean backgrounds and cards

## 📝 Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Display**: Inter for headings
- **Mono**: JetBrains Mono for code

### Type Scale
```css
.text-xs    /* 0.75rem - 12px */
.text-sm    /* 0.875rem - 14px */
.text-base  /* 1rem - 16px */
.text-lg    /* 1.125rem - 18px */
.text-xl    /* 1.25rem - 20px */
.text-2xl   /* 1.5rem - 24px */
.text-3xl   /* 1.875rem - 30px */
.text-4xl   /* 2.25rem - 36px */
.text-5xl   /* 3rem - 48px */
.text-6xl   /* 3.75rem - 60px */
.text-7xl   /* 4.5rem - 72px */
```

### Typography Classes
- `.hero-title` - Large display text for hero sections
- `.section-title` - Section headings
- `.subsection-title` - Subsection headings
- `.card-title` - Card titles
- `.body-text` - Body text
- `.body-text-lg` - Large body text
- `.caption` - Small caption text

## 🧩 Component Library

### Buttons

#### Button Variants
```css
.btn-primary    /* Primary blue button */
.btn-secondary  /* Secondary orange button */
.btn-accent     /* Accent green button */
.btn-outline    /* Outlined button */
.btn-white      /* White button */
.btn-ghost      /* Ghost button */
```

#### Button Sizes
```css
.btn-sm         /* Small button */
.btn            /* Default button */
.btn-lg         /* Large button */
```

#### Usage Example
```jsx
<button className="btn btn-primary btn-lg">
  Request Demo
</button>
```

### Cards

#### Card Variants
```css
.card           /* Basic card */
.card-hover     /* Card with hover effects */
.card-interactive /* Interactive card */
.card-elevated  /* Elevated card */
.card-glass     /* Glass effect card */
```

#### Usage Example
```jsx
<div className="card card-hover p-6">
  <h3 className="card-title">Card Title</h3>
  <p className="body-text">Card content</p>
</div>
```

### Forms

#### Form Components
```css
.input-field        /* Basic input */
.input-field-error  /* Error state input */
.input-field-success /* Success state input */
.textarea-field     /* Textarea */
.select-field       /* Select dropdown */
```

#### Usage Example
```jsx
<input 
  type="email" 
  className="input-field" 
  placeholder="Enter your email" 
/>
```

### Badges

#### Badge Variants
```css
.badge-primary   /* Primary badge */
.badge-secondary /* Secondary badge */
.badge-accent    /* Accent badge */
.badge-success   /* Success badge */
.badge-warning   /* Warning badge */
.badge-error     /* Error badge */
.badge-gray      /* Gray badge */
```

#### Usage Example
```jsx
<span className="badge badge-primary">New</span>
```

### Alerts

#### Alert Variants
```css
.alert-info     /* Info alert */
.alert-success  /* Success alert */
.alert-warning  /* Warning alert */
.alert-error    /* Error alert */
```

#### Usage Example
```jsx
<div className="alert alert-success">
  Success message here
</div>
```

## 🎭 Animations

### Animation Classes
```css
.animate-fade-in      /* Fade in animation */
.animate-fade-in-up   /* Fade in from bottom */
.animate-fade-in-down /* Fade in from top */
.animate-slide-up     /* Slide up animation */
.animate-slide-down   /* Slide down animation */
.animate-slide-left   /* Slide left animation */
.animate-slide-right  /* Slide right animation */
.animate-bounce-in    /* Bounce in animation */
.animate-scale-in     /* Scale in animation */
```

### Hover Effects
```css
.hover-lift    /* Lift on hover */
.hover-glow    /* Glow on hover */
.hover-scale   /* Scale on hover */
```

### Usage with Framer Motion
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Content here
</motion.div>
```

## 🎨 Gradients

### Gradient Backgrounds
```css
.gradient-bg         /* Primary gradient */
.gradient-bg-secondary /* Secondary gradient */
.gradient-bg-accent  /* Accent gradient */
```

### Gradient Text
```css
.gradient-text       /* Primary gradient text */
.gradient-text-accent /* Accent gradient text */
```

## 📱 Layout Components

### Containers
```css
.container-custom    /* Custom container (max-w-7xl) */
.container-narrow    /* Narrow container (max-w-4xl) */
.container-wide      /* Wide container (max-w-8xl) */
```

### Sections
```css
.section            /* Default section padding */
.section-sm         /* Small section padding */
.section-lg         /* Large section padding */
```

## 🎯 Navigation Components

### Navigation Links
```css
.nav-link           /* Basic navigation link */
.nav-link-active    /* Active navigation link */
```

### Sidebar Items
```css
.sidebar-item       /* Basic sidebar item */
.sidebar-item-active /* Active sidebar item */
.sidebar-item-inactive /* Inactive sidebar item */
```

## 📊 Data Visualization

### Tables
```css
.table              /* Basic table */
.table-header       /* Table header */
.table-cell         /* Table cell */
.table-row          /* Table row */
```

### Loading States
```css
.spinner            /* Basic spinner */
.spinner-sm         /* Small spinner */
.spinner-md         /* Medium spinner */
.spinner-lg         /* Large spinner */
```

## 🎨 Utility Classes

### Focus States
```css
.focus-ring         /* Basic focus ring */
.focus-ring-white   /* White focus ring */
```

### Scrollbar Styling
```css
.scrollbar-thin     /* Thin scrollbar */
```

### Glass Effects
```css
.glass              /* Light glass effect */
.glass-dark         /* Dark glass effect */
```

## 🎨 Background Patterns

### Pattern Classes
```css
.bg-grid-pattern    /* Grid pattern background */
.bg-hero-pattern    /* Hero pattern background */
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md-lg)
- **Desktop**: > 1024px (lg)

### Mobile Adaptations
- Hamburger menu for navigation
- Stacked layouts for forms
- Touch-friendly button sizes
- Optimized spacing for small screens

## 🎨 Accessibility

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .card { border: 2px solid #111827; }
  .btn { border: 2px solid; }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

## 🎨 Print Styles

```css
@media print {
  .no-print { display: none !important; }
  .print-break { page-break-before: always; }
}
```

## 🚀 Usage Guidelines

### 1. Component Hierarchy
- Use semantic HTML elements
- Apply utility classes for styling
- Use component classes for complex patterns

### 2. Animation Guidelines
- Use animations sparingly and purposefully
- Respect user's motion preferences
- Ensure animations enhance UX, not distract

### 3. Color Usage
- Use primary colors for main actions
- Use secondary colors for accents
- Use semantic colors for states (success, warning, error)

### 4. Typography Guidelines
- Use appropriate heading hierarchy
- Maintain consistent line heights
- Ensure sufficient color contrast

### 5. Spacing System
- Use consistent spacing scale
- Apply responsive spacing where needed
- Use container classes for layout structure

## 🎨 Design Principles

### 1. Consistency
- Use established patterns and components
- Maintain visual hierarchy
- Follow established spacing and typography rules

### 2. Accessibility
- Ensure sufficient color contrast
- Provide focus indicators
- Support keyboard navigation

### 3. Performance
- Use efficient CSS classes
- Minimize animation complexity
- Optimize for mobile devices

### 4. User Experience
- Prioritize clarity and usability
- Provide clear feedback for interactions
- Maintain intuitive navigation patterns

## 🔧 Customization

### Adding New Colors
```javascript
// In tailwind.config.js
colors: {
  custom: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... full scale
  }
}
```

### Adding New Components
```css
/* In App.css */
@layer components {
  .custom-component {
    @apply /* your styles */;
  }
}
```

### Adding New Animations
```javascript
// In tailwind.config.js
keyframes: {
  customAnimation: {
    '0%': { /* start state */ },
    '100%': { /* end state */ }
  }
}
```

This design system provides a comprehensive foundation for building consistent, accessible, and beautiful user interfaces across the BioPing platform. 