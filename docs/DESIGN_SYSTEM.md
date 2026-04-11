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

  /* Primary — Vibrant Purple */
  --color-primary-50:  #FAF5FF;
  --color-primary-100: #F3E8FF;
  --color-primary-200: #E9D5FF;
  --color-primary-300: #D8B4FE;
  --color-primary-400: #C084FC;
  --color-primary-500: #7C3AED;
  --color-primary-600: #6D28D9;
  --color-primary-700: #5B21B6;
  --color-primary-800: #4C1D95;

  /* Accent — Amber */
  --color-accent-50:   #FFFBEB;
  --color-accent-100:  #FEF3C7;
  --color-accent-400:  #FBBF24;
  --color-accent-500:  #F59E0B;
  --color-accent-600:  #D97706;

  /* Semantics */
  --color-success-50:  #ECFDF5;
  --color-success-100: #D1FAE5;
  --color-success-500: #10B981;
  --color-success-600: #059669;
  --color-success-700: #047857;

  --color-error-50:    #FEF2F2;
  --color-error-100:   #FEE2E2;
  --color-error-500:   #EF4444;
  --color-error-600:   #DC2626;
  --color-error-700:   #B91C1C;

  --color-warning-50:  #FFF7ED;
  --color-warning-100: #FFEDD5;
  --color-warning-500: #F97316;
  --color-warning-600: #EA580C;

  --color-info-50:     #EFF6FF;
  --color-info-500:    #3B82F6;

  /* Backward-compatible aliases used in component specs below */
  --color-success:     var(--color-success-500);
  --color-success-bg:  var(--color-success-50);
  --color-error:       var(--color-error-500);
  --color-error-bg:    var(--color-error-50);
  --color-warning:     var(--color-warning-500);
  --color-warning-bg:  var(--color-warning-50);
  --color-info:        var(--color-info-500);
  --color-info-bg:     var(--color-info-50);

  /* Neutrals (Zinc) */
  --color-neutral-50:  #FAFAFA;
  --color-neutral-100: #F4F4F5;
  --color-neutral-200: #E4E4E7;
  --color-neutral-300: #D4D4D8;
  --color-neutral-400: #A1A1AA;
  --color-neutral-500: #71717A;
  --color-neutral-600: #52525B;
  --color-neutral-700: #3F3F46;
  --color-neutral-800: #27272A;
  --color-neutral-900: #09090B;

  /* Surfaces */
  --color-surface:     #FFFFFF;
  --color-surface-2:   #F8FAFC;
  --color-bg:          #F8FAFC;
  --color-overlay:     rgba(15, 23, 42, 0.5);

  /* Text */
  --color-text-primary:   #09090B;
  --color-text-secondary: #52525B;
  --color-text-muted:     #A1A1AA;
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
