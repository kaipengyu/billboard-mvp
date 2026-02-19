# PulseIQ Design System

Extracted from `src/app/globals.css` and `src/app/page.module.css`.

---

## Colors

### Brand

| Token | Hex | Usage |
|---|---|---|
| `brand-primary` | `#1e40af` | Primary button, active persona card, focus border, accent left-border |
| `brand-primary-dark` | `#1e3a8a` | Primary button hover |
| `brand-primary-10` | `rgba(30, 64, 175, 0.10)` | Focus ring, dropdown item hover |
| `brand-primary-20` | `rgba(30, 64, 175, 0.20)` | Button drop shadow |
| `brand-primary-30` | `rgba(30, 64, 175, 0.30)` | Button hover drop shadow |

### Surface

| Token | Hex | Usage |
|---|---|---|
| `surface-page` | `#eeeeee` | Page background |
| `surface-billboard` | `#87ceeb` | Billboard card background |
| `surface-white` | `#ffffff` | Inputs, cards, dropdowns |
| `surface-card` | `rgba(255, 255, 255, 0.95)` | Location control panel |
| `surface-subtle` | `#f8fafc` | Default persona card, secondary button, popup example block |
| `surface-muted` | `#f8f9fa` | Dropdown item hover |
| `surface-hover` | `#e2e8f0` | Secondary button hover, persona card hover |
| `surface-error` | `#ffcdd2` | Billboard error state background |
| `surface-disabled` | `#f5f5f5` | Disabled input |

### Text

| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#1e293b` | Popup headings, body content |
| `text-default` | `#333333` | Labels, input text, dropdown items |
| `text-secondary` | `#64748b` | Persona name, popup meta, secondary hints |
| `text-tertiary` | `#475569` | Italic / quote text |
| `text-placeholder` | `#666666` | Input placeholder |
| `text-disabled` | `#999999` | Disabled input text |
| `text-muted-disabled` | `#bbbbbb` | Disabled button / card text |
| `text-on-primary` | `#ffffff` | Text on dark blue backgrounds |
| `text-billboard` | `#000000` | Billboard headline |

### Border

| Token | Hex | Usage |
|---|---|---|
| `border-default` | `#d1d5db` | Input border |
| `border-card` | `#e2e8f0` | Persona card, popup image, secondary button |
| `border-dropdown` | `#e0e0e0` | Dropdown container |
| `border-divider` | `#f0f0f0` | Dropdown item dividers |
| `border-disabled` | `#f0f0f0` | Disabled card/button |
| `border-focus` | `#1e40af` | Input focused border (= `brand-primary`) |

### Overlay

| Token | Value | Usage |
|---|---|---|
| `overlay-light` | `rgba(0, 0, 0, 0.10)` | Card and dropdown shadows |
| `overlay-medium` | `rgba(0, 0, 0, 0.30)` | Popup drop shadow |
| `overlay-backdrop` | `rgba(0, 0, 0, 0.50)` | Modal backdrop |

---

## Typography

**Font family:** `Arial, Helvetica, sans-serif` (global) / `Geist Sans` (UI controls)

| Token | Size | Weight | Line height | Letter spacing | Usage |
|---|---|---|---|---|---|
| `type-billboard` | `3rem` | `700` | — | — | Billboard headline |
| `type-billboard-md` | `2.2rem` | `700` | — | — | Billboard headline (≤900px) |
| `type-billboard-sm` | `2rem` | `700` | — | — | Billboard headline (≤600px) |
| `type-brand-link` | `1.8rem` | `600` | — | — | Brand link text |
| `type-popup-title` | `1.5rem` | `600` | — | — | Popup persona name |
| `type-input` | `1.1rem` | `500` | — | — | Location input text |
| `type-button-primary` | `1.1rem` | `600` | — | — | Primary button |
| `type-body` | `1rem` | `400` | `1.6` | — | Popup body, dropdown items, hints |
| `type-label` | `1rem` | `600` | — | — | Section labels (Location, Select Audience) |
| `type-button-secondary` | `1rem` | `500` | — | — | Secondary button |
| `type-persona-tag` | `1rem` | `500` | — | `0.05em` | Audience tag (uppercase) |
| `type-popup-meta` | `0.875rem` | `500` | — | — | Popup persona type |
| `type-popup-section` | `0.875rem` | `600` | — | `0.05em` | Popup section heading (uppercase) |
| `type-persona-name` | `0.85rem` | `500` | `1.2` | — | Persona name below card |

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| `space-1` | `0.25rem` (4px) | Label margin-bottom |
| `space-2` | `0.5rem` (8px) | Persona wrapper gap, popup title gap |
| `space-3` | `0.75rem` (12px) | Persona button grid gap, dropdown item padding, popup example padding |
| `space-4` | `1rem` (16px) | Button group gap, popup header/body padding (mobile) |
| `space-5` | `1.25rem` (20px) | Button horizontal padding |
| `space-6` | `1.5rem` (24px) | Form gap, popup header/body padding, brand-left gap |
| `space-8` | `2rem` (32px) | Billboard padding, container padding |
| `space-10` | `2.5rem` (40px) | Persona tag margin, popup section gap |
| `space-12` | `3rem` (48px) | Form row gap |
| `space-16` | `4rem` (64px) | Page gap |
| `space-20` | `5rem` (80px) | Page padding |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | `4px` | Inline code |
| `radius-md` | `0.5rem` (8px) | QR code, dropdown bottom corners |
| `radius-lg` | `0.75rem` (12px) | Inputs, buttons |
| `radius-xl` | `1rem` (16px) | Billboard container, location panel, popup |
| `radius-full` | `50%` | Persona avatar images |
| `radius-pill` | `128px` | CTA link buttons |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow-card` | `0 4px 20px rgba(0,0,0,0.10)` | Location control panel |
| `shadow-dropdown` | `0 4px 12px rgba(0,0,0,0.10)` | Dropdown menu |
| `shadow-button` | `0 2px 8px rgba(30,64,175,0.20)` | Primary button (resting) |
| `shadow-button-hover` | `0 4px 12px rgba(30,64,175,0.30)` | Primary button (hover) |
| `shadow-popup` | `0 20px 60px rgba(0,0,0,0.30)` | Persona detail modal |

---

## Components

### Billboard

The full-width display card showing the AI-generated energy message.

| Property | Value |
|---|---|
| Background | `surface-billboard` (`#87ceeb`) |
| Border radius | `radius-xl` |
| Width | `80vw`, max `1600px` |
| Min height | `60vh`, max `850px` |
| Padding | `space-8` |
| Error background | `surface-error` (`#ffcdd2`) |

**Slots:** Message text, Audience label (bottom-left), ICF logo (bottom-right)

---

### Message Text

| Property | Value |
|---|---|
| Font size | `type-billboard` → `type-billboard-md` → `type-billboard-sm` |
| Font weight | `700` |
| Color | `text-billboard` (`#000`) |
| Max width | `1100px` |
| Padding | `space-8` `1.75rem` |

---

### Location Panel

White card below the billboard containing the location input and persona selector.

| Property | Value |
|---|---|
| Background | `surface-card` |
| Border radius | `radius-xl` |
| Padding | `space-8` |
| Shadow | `shadow-card` |
| Max width | `1400px` |

---

### Input — Text

| State | Border | Background | Shadow |
|---|---|---|---|
| Default | `2px solid border-default` | `surface-white` | — |
| Focus | `2px solid border-focus` | `surface-white` | `0 0 0 3px brand-primary-10` |
| Disabled | `2px solid border-default` | `surface-disabled` | — |

| Property | Value |
|---|---|
| Padding | `1rem 1.25rem` |
| Font size | `type-input` |
| Border radius | `radius-lg` |

---

### Button — Primary

| State | Background | Shadow |
|---|---|---|
| Default | `brand-primary` | `shadow-button` |
| Hover | `brand-primary-dark` + `translateY(-2px)` | `shadow-button-hover` |
| Active | `brand-primary-dark` + `translateY(0)` | — |
| Disabled | `#cccccc` | — |

| Property | Value |
|---|---|
| Padding | `1rem 2rem` |
| Font size | `type-button-primary` |
| Font weight | `600` |
| Border radius | `radius-lg` |
| Color | `text-on-primary` |

---

### Button — Secondary

| State | Background | Border | Color |
|---|---|---|---|
| Default | `surface-subtle` | `2px solid border-card` | `text-secondary` |
| Hover | `surface-hover` + `translateY(-2px)` | `border-card` darker | `text-secondary` |
| Disabled | `#f9f9f9` | `border-disabled` | `text-muted-disabled` |

| Property | Value |
|---|---|
| Padding | `1rem 1.5rem` |
| Font size | `type-button-secondary` |
| Border radius | `radius-lg` |

---

### Persona Card

Selectable avatar card in the audience selector.

| State | Background | Border | Color |
|---|---|---|---|
| Default | `surface-subtle` | `2px solid border-card` | `text-secondary` |
| Hover | `surface-hover` + `translateY(-2px)` | darker | `text-secondary` |
| Active / Selected | `brand-primary` | `brand-primary` | `text-on-primary` |
| Disabled | `#f9f9f9` | `border-disabled` | `text-muted-disabled` |

| Property | Value |
|---|---|
| Padding | `space-4` |
| Border radius | `radius-lg` |
| Avatar size | `60px × 60px` (mobile: `50px`) |
| Avatar shape | `radius-full` (circle) |
| Avatar border | `2px solid currentColor` (white when active) |
| Name font | `type-persona-name`, `text-secondary`, underline |

---

### Dropdown

| Property | Value |
|---|---|
| Position | Absolute, full width below input |
| Background | `surface-white` |
| Border | `2px solid border-dropdown`, no top border |
| Border radius | `0 0 radius-md radius-md` |
| Shadow | `shadow-dropdown` |
| Max height | `200px`, scrollable |
| Item padding | `0.75rem 1rem` |
| Item hover | `surface-muted` |
| Item divider | `1px solid border-divider` |

---

### Persona Detail Modal

| Property | Value |
|---|---|
| Backdrop | `overlay-backdrop` + `blur(4px)` |
| Panel background | `surface-white` |
| Panel border radius | `radius-xl` |
| Panel shadow | `shadow-popup` |
| Max width | `500px` |
| Entry animation | Fade + scale from `0.95` → `1`, `0.2s ease-out` |
| Header padding | `space-6` |
| Header border | `1px solid border-card` |
| Body padding | `space-6` |
| Body gap | `1.25rem` |
| Section heading | `type-popup-section`, uppercase, `text-secondary` |
| Example block | `surface-subtle`, `border-left: 3px solid brand-primary`, `radius-sm` |

---

## Breakpoints

| Name | Max width | Key changes |
|---|---|---|
| `tablet` | `900px` | Form row stacks vertically; billboard padding reduces; brand footer stacks |
| `mobile` | `600px` | Billboard font shrinks to `2rem`; buttons go full width; persona grid stays 4-col |
| `wide` | `1700px` | Billboard max-width expands to `98vw` |
