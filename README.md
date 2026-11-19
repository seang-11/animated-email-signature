# Signature Studio

**An email signature builder with a live preview. Built by [Prospect Automations](https://prospectautomations.com).**

Design a professional email signature in a few minutes. Pick a template, add your details, adjust the look, then copy the finished signature into Gmail, Outlook or Apple Mail.

---

## What it does

- **Template gallery.** Six starting designs, or start from a blank signature.
- **Live preview.** Every change appears right away inside a mock email window.
- **Full content control.** Name, title, company, tagline, phone, email, website, logo, banner image and a call-to-action button.
- **Social links.** LinkedIn, Instagram, Facebook, Threads, X, TikTok, YouTube and Substack.
- **Design controls.** Layouts, colors, fonts, text sizes, dividers, logo shape and icon styles. A drag-and-drop arranger lets you reorder sections of the signature.
- **Multiple signatures per person.** For example, a full version for new emails and a compact one for replies. You can set a default, rename, duplicate or delete them.
- **Undo and redo.** Use Cmd+Z and Cmd+Shift+Z, or revert to your last saved version.
- **One-click export.** Copy the formatted signature, copy the HTML, or download an `.html` file. Setup steps are included for each email app.
- **Guided tour** for first-time users.

## How it's built

| Layer | Tools |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Drag and drop | @dnd-kit |
| Backend | [Zite](https://zite.com) workflows (server-side TypeScript endpoints) |
| Database | Zite database (Postgres) |
| Sign-in | Email magic link through Zite auth |

### Project layout

```
apps/signature-studio/
├── src/
│   ├── api/            # Backend workflows: create, load, save, duplicate, delete, generate HTML
│   ├── components/     # Editor, live preview, template gallery, export tab, block arranger
│   ├── hooks/          # Undo/redo history
│   └── utils/          # Fonts, layout zones, demo mode
└── OVERVIEW.md         # Product summary
packages/components/    # Shared UI library (shadcn/ui)
zite.schema.json        # Database schema
```

### Design decisions worth noting

- **Email-safe HTML.** Email apps strip modern CSS, so the `generateHtml` workflow builds the signature from tables and inline styles. That way it looks the same in Gmail, Outlook and Apple Mail.
- **Every workflow checks the user.** Each backend endpoint requires sign-in and only touches the signed-in person's own signatures.
- **Demo mode with fake people.** In the public demo, real names and contact details are swapped for made-up people. Visitors see real designs, but nobody's personal information.

## Running it

This app runs on [Zite](https://zite.com). To use it as a starting point, copy the template into your own Zite workspace. The database, sign-in and hosting come with it.

---

Built by **Sean Grady** at **Prospect Automations**. I build custom internal tools and automations for small businesses.
