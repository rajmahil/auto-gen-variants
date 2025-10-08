<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>

<h1 align="center">
  Auto-Generate Variants — Medusa Admin Widget
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Build and manage variants without the manual grind.
</p>

---

# @306technologies/auto-gen-variants

A **Medusa.js admin widget** that automatically creates all **missing product variant combinations** from your product’s option values — no more manual setup.

- 🚀 **1-click generation** of missing variants
- 🧮 **Accurate combinations** from selected option values
- 🛡️ **Non-destructive**: existing variants are left as-is
- 🎯 **Built for Medusa v2 Admin** (Admin Bundler)

> **Status:** Actively iterating on the **0.1.x** line before a stable `1.x`.

---

## Compatibility

- **Medusa:** `@medusajs/medusa >= 2.5.0`
- **Admin UI:** `@medusajs/ui >= 4.0.3`
- **Node:** `>= 20`

---

## Install

```bash
# in your Medusa project
npm i @306technologies/auto-gen-variants
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

**Fix checklist**

1. **Reinstall clean**
   ```bash
   npm uninstall @306technologies/auto-gen-variants
   rm -rf node_modules package-lock.json
   npm i
   npm i @306technologies/auto-gen-variants@latest
   ```
