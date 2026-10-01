import { useState } from 'react';
import { generateHtml } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Copy, Code2, Download, Mail, Monitor, Apple, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { SigData } from './SignatureEditor';

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {children}
    </div>
  );
}

function QuirkItem({ client, notes }: { client: string; notes: string[] }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <p className="mb-1 text-xs font-semibold text-foreground">{client}</p>
      <ul className="space-y-0.5">
        {notes.map((n, i) => (
          <li key={i} className="text-[11px] text-muted-foreground">• {n}</li>
        ))}
      </ul>
    </div>
  );
}

const CLIENTS = [
  {
    key: 'gmail',
    label: 'Gmail',
    icon: Mail,
    steps: [
      'Open Gmail → Settings (gear icon) → See all settings',
      'Go to the General tab, scroll down to Signature',
      'Create a new signature or select an existing one',
      'Click inside the editor, then paste with Ctrl+V (or Cmd+V on Mac)',
      'Scroll to the bottom and click Save Changes',
    ],
  },
  {
    key: 'outlook',
    label: 'Outlook',
    icon: Monitor,
    steps: [
      'Open Outlook → Settings → View all Outlook settings',
      'Go to Mail → Compose and reply',
      'Under Email signature, click + New signature',
      'Name the signature, then paste into the editor with Ctrl+V',
      'Click Save, then set it as default for new emails',
    ],
  },
  {
    key: 'apple',
    label: 'Apple Mail',
    icon: Apple,
    steps: [
      'Open Mail → Settings → Signatures',
      'Click the + button to create a new signature',
      'In the right pane, paste with Cmd+V',
      'Drag the new signature onto an email account to assign it',
    ],
  },
];

export default function ExportTab({ sig, flushSave }: { sig: SigData; flushSave?: () => Promise<void> }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState('gmail');

  /* Always regenerate: save any pending edits first, then build fresh HTML so a
     copy always matches what's on screen. */
  const fetchHtml = async () => {
    setLoading(true);
    try {
      if (flushSave) await flushSave();
      // Demo signatures exist only in the browser — send their values along
      const { id, __demo, owner, lastUpdated, ...rest } = sig;
      const res = await generateHtml(__demo ? { id, overrides: rest } : { id });
      setHtml(res.html);
      return res.html;
    } catch {
      toast.error('Failed to generate HTML');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const copyRich = async () => {
    const h = await fetchHtml();
    if (!h) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([h], { type: 'text/html' }),
          'text/plain': new Blob([h], { type: 'text/plain' }),
        }),
      ]);
      toast.success('Signature copied — paste it into your email client');
    } catch {
      await navigator.clipboard.writeText(h);
      toast.success('HTML copied to clipboard');
    }
  };

  const copyHtml = async () => {
    const h = await fetchHtml();
    if (!h) return;
    await navigator.clipboard.writeText(h);
    toast.success('HTML source copied');
  };

  const downloadHtml = async () => {
    const h = await fetchHtml();
    if (!h) return;
    const blob = new Blob([`<!DOCTYPE html><html><body>${h}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-signature.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  const selected = CLIENTS.find(c => c.key === client) || CLIENTS[0];

  return (
    <div className="space-y-5">
      <SectionCard icon={Copy} title="Export Actions">
        <p className="mb-3 flex items-center gap-1.5 rounded-md bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
          <RefreshCw className="h-3 w-3 flex-shrink-0 text-primary" />
          Every copy and download always regenerates from your latest edits — you'll never paste a stale version.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={copyRich} disabled={loading} className="gap-2 shadow-sm">
            <Copy className="h-4 w-4" /> Copy signature
          </Button>
          <Button variant="outline" onClick={copyHtml} disabled={loading} className="gap-2">
            <Code2 className="h-4 w-4" /> Copy HTML
          </Button>
          <Button variant="outline" onClick={downloadHtml} disabled={loading} className="gap-2">
            <Download className="h-4 w-4" /> Download .html
          </Button>
        </div>
        <div className="mt-4 space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] font-medium text-foreground">Which button should I use?</p>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            <li><strong className="text-foreground">Copy signature</strong> — ⭐ the one most people want. Pastes your formatted signature directly into Gmail, Outlook, or Apple Mail. Just paste (Ctrl+V / Cmd+V) in the signature editor.</li>
            <li><strong className="text-foreground">Copy HTML</strong> — copies the raw HTML source code. Useful if your email client has an "Insert HTML" option or if you need to give the code to a developer.</li>
            <li><strong className="text-foreground">Download .html</strong> — saves the signature as a file. Handy for backup, sharing with teammates, or importing into tools that accept HTML files.</li>
          </ul>
        </div>
      </SectionCard>

      {html && (
        <SectionCard icon={Code2} title="HTML Source">
          <div className="max-h-48 overflow-auto rounded-lg border border-border bg-muted/50 p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">{html}</pre>
          </div>
        </SectionCard>
      )}

      <SectionCard icon={Mail} title="Setup Instructions">
        <div className="mb-4 inline-flex rounded-lg bg-muted p-1">
          {CLIENTS.map(c => (
            <button
              key={c.key}
              onClick={() => setClient(c.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                client === c.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <ol className="space-y-2">
          {selected.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* Email client quirks */}
      <SectionCard icon={AlertTriangle} title="Email Client Quirks">
        <p className="mb-3 text-[11px] text-muted-foreground">
          Email clients render HTML differently from web browsers. Here's what to expect:
        </p>
        <div className="space-y-3">
          <QuirkItem
            client="Gmail"
            notes={[
              "Supports most fonts and images well. GIF animations work.",
              "May strip some styles if the signature is very complex.",
              "Images need to be hosted online (uploaded images already are).",
            ]}
          />
          <QuirkItem
            client="Outlook (desktop)"
            notes={[
              "Uses Word's rendering engine, which is less flexible than browsers.",
              "May add extra spacing around images or ignore some padding.",
              "Custom/Google fonts will fall back to system defaults (Arial, Times).",
              "Rounded corners on buttons may appear as sharp rectangles.",
            ]}
          />
          <QuirkItem
            client="Apple Mail"
            notes={[
              "Generally the best rendering — closest to what you see in the preview.",
              "Supports most fonts, images, and layout features.",
              "Drag your signature onto an email account after creating it.",
            ]}
          />
        </div>
        <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
          💡 <strong className="text-foreground">Tip:</strong> Stick to email-safe fonts (Arial, Georgia, Verdana, etc.) and keep images under 600px wide for the most consistent results across all clients.
        </p>
      </SectionCard>
    </div>
  );
}
