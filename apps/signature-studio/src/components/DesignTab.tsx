import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Slider } from '@project/components/ui/slider';
import { Switch } from '@project/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Button } from '@project/components/ui/button';
import { RotateCcw, LayoutGrid, Palette, Type, Maximize2, SlidersHorizontal } from 'lucide-react';
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

const LAYOUTS = [
  { value: 'Logo Left', label: 'Logo Left', desc: 'Classic side-by-side' },
  { value: 'Stacked', label: 'Stacked', desc: 'Top-down vertical' },
  { value: 'Compact', label: 'Compact', desc: 'One-line minimal' },
];

const FONTS = ['Arial', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Courier New'];

const PRESET_COLORS = ['#111111', '#3E6FE7', '#1a1a2e', '#b40407', '#2d6a4f', '#7c3aed'];

const DEFAULTS = {
  accentColor: '#111111',
  textColor: '#333333',
  headingFont: 'Arial',
  bodyFont: 'Arial',
  logoSize: 96,
  bannerSize: 180,
  baseTextSize: 14,
  showDivider: true,
  roundSocialIcons: true,
  layout: 'Logo Left',
};

export default function DesignTab({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  const resetDefaults = () => {
    Object.entries(DEFAULTS).forEach(([k, v]) => updateField(k, v));
  };

  return (
    <div className="space-y-5">
      <SectionCard icon={LayoutGrid} title="Layout">
        <div className="grid grid-cols-3 gap-3">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              onClick={() => updateField('layout', l.value)}
              className={`rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                sig.layout === l.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{l.label}</p>
              <p className="text-xs text-muted-foreground">{l.desc}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Palette} title="Colors">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Accent color</Label>
            <div className="mt-1 flex items-center gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => updateField('accentColor', c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform duration-150 hover:scale-110 ${
                    sig.accentColor === c ? 'border-ring ring-2 ring-ring/30' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                />
              ))}
              <Input
                value={sig.accentColor || '#111111'}
                onChange={e => updateField('accentColor', e.target.value)}
                className="ml-2 w-28 font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Text color</Label>
            <Input
              value={sig.textColor || '#333333'}
              onChange={e => updateField('textColor', e.target.value)}
              className="mt-1 w-28 font-mono text-sm"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Type} title="Typeface">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Heading font</Label>
            <Select value={sig.headingFont || 'Arial'} onValueChange={v => updateField('headingFont', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Body font</Label>
            <Select value={sig.bodyFont || 'Arial'} onValueChange={v => updateField('bodyFont', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Maximize2} title="Sizing">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Logo size</span><span>{sig.logoSize || 96} px</span>
            </div>
            <Slider
              value={[sig.logoSize || 96]}
              onValueChange={([v]) => updateField('logoSize', v)}
              min={32} max={160} step={4}
              className="mt-2"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Banner size</span><span>{sig.bannerSize || 180} px</span>
            </div>
            <Slider
              value={[sig.bannerSize || 180]}
              onValueChange={([v]) => updateField('bannerSize', v)}
              min={100} max={400} step={10}
              className="mt-2"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Base text size</span><span>{sig.baseTextSize || 14} px</span>
            </div>
            <Slider
              value={[sig.baseTextSize || 14]}
              onValueChange={([v]) => updateField('baseTextSize', v)}
              min={10} max={20} step={1}
              className="mt-2"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={SlidersHorizontal} title="Details">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/30">
            <span className="text-sm text-foreground">Vertical divider</span>
            <Switch checked={sig.showDivider !== false} onCheckedChange={v => updateField('showDivider', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/30">
            <span className="text-sm text-foreground">Round social icons</span>
            <Switch checked={sig.roundSocialIcons !== false} onCheckedChange={v => updateField('roundSocialIcons', v)} />
          </div>
        </div>
      </SectionCard>

      <Button variant="outline" onClick={resetDefaults} className="gap-2 transition-all hover:shadow-sm">
        <RotateCcw className="h-4 w-4" /> Reset to defaults
      </Button>
    </div>
  );
}
