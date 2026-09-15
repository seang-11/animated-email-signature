import { useState, useRef } from 'react';
import { generateHtml } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Copy, Code2, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { SigData } from './SignatureEditor';

const CLIENTS = [
  {
    key: 'gmail',
    label: 'Gmail',
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
    steps: [
      'Open Mail → Settings → Signatures',
      'Click the + button to create a new signature',
      'In the right pane, paste with Cmd+V',
      'Drag the new signature onto an email account to assign it',
    ],
  },
];

export default function ExportTab({ sig }: { sig: SigData }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState('gmail');
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchHtml = async () => {
    if (html) return html;
    setLoading(true);
    try {
      const res = await generateHtml({ id: sig.id });
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
      // fallback
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
    <div className="space-y-6">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Export Actions</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={copyRich} disabled={loading} className="gap-2">
            <Copy className="h-4 w-4" /> Copy signature
          </Button>
          <Button variant="outline" onClick={copyHtml} disabled={loading} className="gap-2">
            <Code2 className="h-4 w-4" /> Copy HTML
          </Button>
          <Button variant="outline" onClick={downloadHtml} disabled={loading} className="gap-2">
            <Download className="h-4 w-4" /> Download .html
          </Button>
        </div>
      </section>

      {html && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">HTML Source</p>
          <div className="max-h-48 overflow-auto rounded-lg border border-border bg-muted p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">{html}</pre>
          </div>
        </section>
      )}

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setup Instructions</p>
        <div className="flex gap-2 mb-4">
          {CLIENTS.map(c => (
            <button
              key={c.key}
              onClick={() => setClient(c.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                client === c.key
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <ol className="space-y-2">
          {selected.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
