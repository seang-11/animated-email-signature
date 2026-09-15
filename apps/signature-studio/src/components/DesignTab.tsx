import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Slider } from '@project/components/ui/slider';
import { Switch } from '@project/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Button } from '@project/components/ui/button';
import { RotateCcw, LayoutGrid, Palette, Type, Maximize2, Space, Share2, Eye, SlidersHorizontal } from 'lucide-react';
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

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/30">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SliderRow({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span><span>{value}{unit || ' px'}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="mt-2" />
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

const DEFAULTS: Record<string, any> = {
  layout: 'Logo Left',
  accentColor: '#111111',
  textColor: '#333333',
  headingFont: 'Arial',
  bodyFont: 'Arial',
  logoSize: 96,
  bannerSize: 180,
  baseTextSize: 14,
  showDivider: true,
  roundSocialIcons: true,
  companySize: 13,
  companyColor: '',
  companyBold: false,
  socialPosition: 'under_details',
  socialIconSize: 24,
  contactIconStyle: 'dark_mode_safe',
  showCompany: true,
  showTagline: true,
  showAddress: true,
  showSocials: true,
  blockSpacing: 8,
};

export default function DesignTab({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  const resetDefaults = () => {
    Object.entries(DEFAULTS).forEach(([k, v]) => updateField(k, v));
  };

  return (
    <div className="space-y-5">
      {/* Layout */}
      <SectionCard icon={LayoutGrid} title="Layout">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      {/* Colors */}
      <SectionCard icon={Palette} title="Colors">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Accent color</Label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
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
              <Input value={sig.accentColor || '#111111'} onChange={e => updateField('accentColor', e.target.value)} className="ml-1 w-28 font-mono text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Text color</Label>
            <Input value={sig.textColor || '#333333'} onChange={e => updateField('textColor', e.target.value)} className="mt-1 w-28 font-mono text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Company color</Label>
            <Input value={sig.companyColor || ''} onChange={e => updateField('companyColor', e.target.value)} placeholder="Inherits text color" className="mt-1 w-28 font-mono text-sm" />
          </div>
        </div>
      </SectionCard>

      {/* Typeface */}
      <SectionCard icon={Type} title="Typeface">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* Sizing */}
      <SectionCard icon={Maximize2} title="Sizing">
        <div className="space-y-4">
          <SliderRow label="Logo size" value={sig.logoSize || 96} min={32} max={160} step={4} onChange={v => updateField('logoSize', v)} />
          <SliderRow label="Banner size" value={sig.bannerSize || 180} min={100} max={400} step={10} onChange={v => updateField('bannerSize', v)} />
          <SliderRow label="Base text size" value={sig.baseTextSize || 14} min={10} max={20} step={1} onChange={v => updateField('baseTextSize', v)} />
          <SliderRow label="Company text size" value={sig.companySize || 13} min={9} max={18} step={1} onChange={v => updateField('companySize', v)} />
        </div>
      </SectionCard>

      {/* Spacing */}
      <SectionCard icon={Space} title="Spacing">
        <SliderRow label="Block spacing" value={sig.blockSpacing ?? 8} min={2} max={20} step={1} onChange={v => updateField('blockSpacing', v)} />
      </SectionCard>

      {/* Social Icons */}
      <SectionCard icon={Share2} title="Social Icons">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Position</Label>
            <Select value={sig.socialPosition || 'under_details'} onValueChange={v => updateField('socialPosition', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="under_details">Under details</SelectItem>
                <SelectItem value="right_column">Right column</SelectItem>
                <SelectItem value="under_banner">Under banner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SliderRow label="Icon size" value={sig.socialIconSize || 24} min={16} max={40} step={2} onChange={v => updateField('socialIconSize', v)} />
          <ToggleRow label="Round icons" checked={sig.roundSocialIcons !== false} onChange={v => updateField('roundSocialIcons', v)} />
          <div>
            <Label className="text-xs text-muted-foreground">Contact icon style</Label>
            <Select value={sig.contactIconStyle || 'filled'} onValueChange={v => updateField('contactIconStyle', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="outlined">Outlined</SelectItem>
                <SelectItem value="dark_mode_safe">Dark mode safe</SelectItem>
                <SelectItem value="none">No icons</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Visibility */}
      <SectionCard icon={Eye} title="Visibility">
        <div className="space-y-2">
          <ToggleRow label="Show company" checked={sig.showCompany !== false} onChange={v => updateField('showCompany', v)} />
          <ToggleRow label="Bold company" checked={sig.companyBold ?? false} onChange={v => updateField('companyBold', v)} />
          <ToggleRow label="Show tagline" checked={sig.showTagline !== false} onChange={v => updateField('showTagline', v)} />
          <ToggleRow label="Show address" checked={sig.showAddress !== false} onChange={v => updateField('showAddress', v)} />
          <ToggleRow label="Show social icons" checked={sig.showSocials !== false} onChange={v => updateField('showSocials', v)} />
          <ToggleRow label="Vertical divider" checked={sig.showDivider !== false} onChange={v => updateField('showDivider', v)} />
        </div>
      </SectionCard>

      <Button variant="outline" onClick={resetDefaults} className="gap-2 transition-all hover:shadow-sm">
        <RotateCcw className="h-4 w-4" /> Reset to defaults
      </Button>
    </div>
  );
}
