<br/>
<br/>

<p align="center">
  <!-- Medusa -->
  <a href="https://www.medusajs.com" aria-label="Medusa">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
      <img alt="Medusa" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg" height="56">
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <!-- 306 Technologies -->  
  <a href="https://www.306technologies.com" aria-label="306 Technologies">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/rajmahil/auto-gen-variants/refs/heads/main/src/assets/306-logo-light.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/rajmahil/auto-gen-variants/refs/heads/main/src/assets/306-logo-light.svg">
      <img alt="306 Technologies" src="https://raw.githubusercontent.com/rajmahil/auto-gen-variants/refs/heads/main/src/assets/306-logo-light.svg" height="56">
    </picture>
  </a>
</p>

<h1 align="center">
  Auto-Generate Variants — Medusa Admin Widget
</h1>
<p align="center">
  Build and manage variants without the manual grind.
</p>

---

<h3 align="center">Built by <a href="https://www.306technologies.com" target="_blank">306 Technologies</a></h3>
<p align="center">
  Medusa & headless commerce experts — We build eCommerce platforms that industry leaders trust
</p>

<p align="center">
  <a href="https://www.306technologies.com" target="_blank">
    <img src="https://img.shields.io/badge/Website-306%20Technologies-111827?logo=google-chrome" alt="306 Technologies Website"/>
  </a>
  <a href="https://cal.com/team/306-technologies/meeting-with-raj?overlayCalendar=true" target="_blank">
    <img src="https://img.shields.io/badge/Book%20a%20Call-30%20min-2563EB?logo=google-calendar&logoColor=white" alt="Book a Call"/>
  </a>
  <a href="mailto:raj@306technologies.com" target="_blank">
    <img src="https://img.shields.io/badge/Contact-raj%40306technologies.com-10B981?logo=minutemailer&logoColor=white" alt="Email 306 Technologies"/>
  </a>
</p>

<hr/>

<h4 align="center">
  <a href="https://docs.medusajs.com">Medusa Docs</a> |
  <a href="https://www.medusajs.com">Medusa Website</a>
</h4>

---

# @306technologies/auto-gen-variants

A **Medusa.js admin widget** that automatically creates all **missing product variant combinations** from your product’s option values — no more manual setup.

- 🚀 **1-click generation** of missing variants
- 🧮 **Accurate combinations** from selected option values
- 🛡️ **Non-destructive**: existing variants are left as-is
- 🎯 **Built for Medusa v2 Admin**

---

## Compatibility

- **Medusa:** `@medusajs/medusa >= 2.5.0`
- **Admin UI:** `@medusajs/ui >= 4.0.3`
- **Node:** `>= 20`

---

## Install

```bash
npm i @306technologies/auto-gen-variants
```

### Add the plugin in your Medusa config

`medusa.config.ts`

```ts
import { defineConfig } from "@medusajs/medusa";

export default defineConfig({
  // ...other settings
  plugins: [
    {
      resolve: "@306technologies/auto-gen-variants",
      options: {}, // no options required
    },
  ],
});
```

### Run development server

```bash
npm run dev
```

---

## How It Works (at a glance)

- Reads the product’s option values (e.g., Size × Color × Material).
- Computes the cartesian product, filters out existing variants.
- Creates the remaining variants through Medusa APIs.
- Shows a quick summary (created vs. already existed).

---

## Troubleshooting

### Widget not appearing

**Reinstall clean**

```bash
npm uninstall @306technologies/auto-gen-variants
rm -rf node_modules package-lock.json
npm i
npm i @306technologies/auto-gen-variants@latest
```

---

## Links

- **Website (306 Technologies):** https://www.306technologies.com
- **X/Twitter** https://x.com/RajFrom306
- **Linkedin** www.linkedin.com/in/raj-mahil
