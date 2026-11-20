# Signature Studio

**A drag-and-drop email signature builder with a live preview and email-safe export.**
Built by [Prospect Automations](https://prospectautomations.com) on [Zite](https://zite.com).

Pick a template, add your details, shape the look, and copy a finished signature straight into Gmail, Outlook or Apple Mail — no HTML knowledge required.

**[▶ Try it / copy it on the Zite Marketplace](https://www.zite.com/marketplace/custom-email-signature)**

---

## Features

| | |
|---|---|
| 🎨 **Template gallery** | Six designed starting points, or start from blank |
| 👁️ **Live preview** | Every change renders instantly inside a mock email window |
| ✋ **Drag-and-drop layout** | Rearrange blocks directly in the preview, across Left / Main / Bottom zones |
| ✏️ **Full content control** | Name, title, company, tagline, contacts, logo (incl. animated GIF), banner, CTA button |
| 🔗 **Social links** | LinkedIn, Instagram, Facebook, Threads, X, TikTok and more |
| 🖌️ **Design controls** | Colors, font pairings with email-safe fallbacks, sizes, spacing, dividers, icon styles |
| 🗂️ **Multiple signatures** | Default, rename, duplicate and delete — one per role, team or brand |
| ↩️ **Undo / redo & autosave** | `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl/Cmd+S`, plus revert-to-saved |
| 📋 **One-click export** | Copy formatted signature, copy HTML, or download `.html` — with per-client setup steps |
| 🧭 **Guided tour** | Spotlight walkthrough and inline tips for first-time users |

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion |
| Drag and drop | @dnd-kit |
| Backend | Zite endpoints (server-side TypeScript, Zod-validated) |
| Database | Zite Database (Postgres) |
| Auth | Emailed sign-in code via Zite auth |

## Project structure

```
.
├── apps/signature-studio/
│   ├── src/
│   │   ├── api/                    # Backend endpoints (all require sign-in)
│   │   │   ├── loadSignature.ts    #   List the user's signatures + load the active one
│   │   │   ├── saveSignature.ts    #   Autosave changes
│   │   │   ├── createSignature.ts  #   New signature from a template
│   │   │   ├── duplicateSignature.ts
│   │   │   ├── deleteSignature.ts
│   │   │   └── generateHtml.ts     #   Email-safe, table-based HTML export
│   │   ├── components/
│   │   │   ├── SignatureEditor.tsx #   App shell: toolbar, autosave, tabs, demo mode
│   │   │   ├── EditTab.tsx         #   Theme, section cards and layout controls
│   │   │   ├── SignaturePreview.tsx#   Live preview with drag-and-drop zones
│   │   │   ├── ExportTab.tsx       #   Copy / download + client setup guides
│   │   │   ├── TemplateGallery.tsx
│   │   │   ├── SignatureSwitcher.tsx
│   │   │   ├── BlockArranger.tsx
│   │   │   ├── GuidedTour.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   └── InfoTip.tsx
│   │   ├── hooks/useUndoRedo.ts    # Undo/redo history with saved-state tracking
│   │   └── utils/
│   │       ├── zones.ts            # Block/zone model and layout presets
│   │       ├── fonts.ts            # Font catalogue and fallback stacks
│   │       └── demoMode.ts         # Marketplace demo detection + sample people
│   └── OVERVIEW.md                 # Product summary
├── packages/components/            # Shared UI library (shadcn/ui)
└── zite.schema.json                # Database schema
```

## Design notes

- **Email-safe HTML.** Email clients strip modern CSS, so `generateHtml` builds signatures from nested tables, inline styles, PNG icons and full font fallback stacks — they render consistently in Gmail, Outlook and Apple Mail.
- **One model, two renderers.** The live preview and the HTML exporter read the same signature record and the same zone layout (`utils/zones.ts`), so what you see is what you paste.
- **Per-user data isolation.** Every endpoint requires sign-in and only reads or writes the signed-in user's own signatures.
- **Privacy-safe demo.** In the read-only marketplace demo, real names and contact details are swapped for fictional people on the client, while the designs stay intact. Saves are skipped gracefully instead of erroring.

## Get Signature Studio

There are two ways to use Signature Studio yourself:

### Option 1 — Copy it on Zite (recommended)

👉 **[Get Signature Studio on the Zite Marketplace](https://www.zite.com/marketplace/custom-email-signature)**

1. Open the marketplace listing and try the live demo.
2. Sign up for a free Zite account (or sign in).
3. Click to copy the solution into your own workspace.

The database, sign-in and hosting come included — no setup, no deploys. You can start building signatures immediately and customize the app with Zite's AI editor.

### Option 2 — Download the code

Clone or download this repository to explore the source, adapt it, or use it as a reference. The app is built for the Zite platform (endpoints, database and auth use the `zitejs` SDK), so the easiest way to run it end-to-end is still to copy it from the [Zite Marketplace](https://www.zite.com/marketplace/custom-email-signature).

---

Built by **Sean Grady** at **Prospect Automations** — custom internal tools and automations for small businesses. Email: sean@prospectautomations.com
