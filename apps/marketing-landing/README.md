# Marketing Landing — Arcon

Landing page estática para Arcon, desarrollada con Astro + Tailwind CSS.

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`           | Installs dependencies                            |
| `pnpm dev`               | Starts local dev server at `localhost:4321`      |
| `pnpm build`             | Build production site to `./dist/`               |
| `pnpm preview`           | Preview build locally before deploying           |
| `pnpm astro check`       | Run Astro type checking                          |

## Structure

```text
/
├── public/                  # Static assets (images, fonts)
├── src/
│   ├── components/          # Astro components
│   │   ├── layout/          # Header, Footer, SEO
│   │   ├── sections/        # Page sections
│   │   └── ui/              # Reusable UI components
│   ├── content/             # Content collections (JSON)
│   │   ├── features/        # Feature cards
│   │   ├── plans/           # Pricing plans
│   │   ├── testimonials/    # User testimonials
│   │   └── faqs/            # FAQ items
│   ├── layouts/             # Page layouts
│   ├── pages/               # Routes (index, features, pricing)
│   └── styles/              # Global CSS
└── package.json
```
