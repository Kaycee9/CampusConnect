# CampusConnect — Design System

## Fonts

Import in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## CSS Custom Properties (Design Tokens)

```css
:root {
  /* === COLORS === */

  /* Primary — Brand Blue */
  --color-primary-50:  #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-400: #3B82F6;
  --color-primary-500: #2563EB;
  --color-primary-600: #1D4ED8;
  --color-primary-700: #1E40AF;

  /* Accent — Amber */
  --color-accent-50:   #FFFBEB;
  --color-accent-400:  #FBBF24;
  --color-accent-500:  #F59E0B;
  --color-accent-600:  #D97706;

  /* Semantics */
  --color-success:     #10B981;
  --color-success-bg:  #ECFDF5;
  --color-error:       #EF4444;
  --color-error-bg:    #FEF2F2;
  --color-warning:     #F97316;
  --color-warning-bg:  #FFF7ED;
  --color-info:        #3B82F6;
  --color-info-bg:     #EFF6FF;

  /* Neutrals */
  --color-neutral-900: #0F172A;
  --color-neutral-800: #1E293B;
  --color-neutral-700: #334155;
  --color-neutral-600: #475569;
  --color-neutral-500: #64748B;
  --color-neutral-400: #94A3B8;
  --color-neutral-300: #CBD5E1;
  --color-neutral-200: #E2E8F0;
  --color-neutral-100: #F1F5F9;
  --color-neutral-50:  #F8FAFC;

  /* Surfaces */
  --color-surface:     #FFFFFF;
  --color-surface-2:   #F8FAFC;
  --color-bg:          #F8FAFC;

  /* Text */
  --color-text-primary:   var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-700);
  --color-text-muted:     var(--color-neutral-400);
  --color-text-inverse:   #FFFFFF;

  /* === TYPOGRAPHY === */
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body:    'Inter', sans-serif;

  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */
  --text-5xl:  3rem;       /* 48px */

  --font-regular:   400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;
  --font-extrabold: 800;

  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed:1.75;

  /* === SPACING === */
  --space-0:  0;
  --space-1:  0.25rem;  /* 4px */
  --space-2:  0.5rem;   /* 8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */

  /* === BORDER RADIUS === */
  --radius-sm:   0.375rem;  /* 6px */
  --radius-md:   0.625rem;  /* 10px */
  --radius-lg:   1rem;      /* 16px */
  --radius-xl:   1.5rem;    /* 24px */
  --radius-full: 9999px;

  /* === SHADOWS === */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06);
  --shadow-xl: 0 20px 60px rgba(0,0,0,0.12);

  /* === TRANSITIONS === */
  --transition-fast: 100ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;

  /* === Z-INDEX SCALE === */
  --z-base:    0;
  --z-raised:  10;
  --z-dropdown:200;
  --z-sticky:  300;
  --z-overlay: 400;
  --z-modal:   500;
  --z-toast:   600;
}
```

---

## Component Specs

### Button

```
Variants: primary | secondary | ghost | destructive | link
Sizes:    sm | md | lg
States:   default | hover | active | disabled | loading
```

| Variant | Background | Text | Border |
|---|---|---|---|
| primary | --color-primary-500 | white | none |
| secondary | transparent | --color-primary-500 | 1.5px solid --color-primary-500 |
| ghost | transparent | --color-neutral-700 | none |
| destructive | --color-error | white | none |

**Sizing:**
| Size | Height | Padding | Font |
|---|---|---|---|
| sm | 32px | 8px 14px | --text-sm |
| md | 40px | 10px 20px | --text-base |
| lg | 48px | 12px 28px | --text-lg |

---

### Badge (Status Chip)

| Status | Background | Text Color |
|---|---|---|
| PENDING | --color-warning-bg | --color-warning |
| ACCEPTED | --color-info-bg | --color-info |
| IN_PROGRESS | --color-primary-50 | --color-primary-600 |
| COMPLETED | --color-success-bg | --color-success |
| REJECTED | --color-error-bg | --color-error |
| CANCELLED | --color-neutral-100 | --color-neutral-500 |
| Available | --color-success-bg | --color-success |
| Busy | --color-error-bg | --color-error |

---

### Artisan Card

```
Layout:     Vertical card, 280px min-width
Avatar:     64px circle, top-left
Name:       --text-xl, --font-semibold, --color-text-primary
Category:   --text-sm, --color-primary-500, with icon
Rating:     Star icon (amber) + number + "(N reviews)"
Location:   Map pin icon + address string
Price:      "From ₦X,XXX" — --text-lg, --font-bold
CTA:        Full-width primary button "View Profile"
Availability badge: top-right corner
```

---

### Booking Card

```
Layout:     Horizontal card
Left:       Artisan avatar + name + category
Center:     Booking title + date + address
Right:      Status badge + action button
Bottom:     Agreed price if accepted
```

---

## Screen Breakpoints

```css
/* Mobile first */
/* xs: 0px – default */
@media (min-width: 480px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## Page Layout Grid

```css
/* Container */
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4); /* 16px */
}

@media (min-width: 768px) {
  .container { padding: 0 var(--space-8); }
}

/* Dashboard layout */
.dashboard-layout {
  display: grid;
  grid-template-columns: 260px 1fr; /* sidebar + main */
  min-height: 100vh;
}

@media (max-width: 1023px) {
  .dashboard-layout {
    grid-template-columns: 1fr; /* stack on mobile */
  }
}
```
