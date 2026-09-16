import { useRef } from 'react';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Slider } from '@project/components/ui/slider';
import { Switch } from '@project/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Button } from '@project/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@project/components/ui/accordion';
import {
  RotateCcw, LayoutGrid, Palette, User, Building2, Quote, Mail, Image as ImageIcon,
  ImagePlus, Share2, MousePointerClick, FileText, Upload, X,
} from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import type { SigData } from './SignatureEditor';
import ColorPicker from './ColorPicker';
import BlockArranger from './BlockArranger';
import { getZones, PRESET_ZONES, type ZonesConfig } from '../utils/zones';

/* ─── Reusable helpers ─── */
function Field({ label, value, field, updateField, placeholder }: { label: string; value: string; field: string; updateField: (k: string, v: any) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value || ''} onChange={e => updateField(field, e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/30">
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

function Img({ label, field, currentUrl, updateField }: { label: string; field: string; currentUrl?: string; updateField: (k: string, v: any) => void }) {
  const { upload, isUploading } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error(`"${file.name}" isn't an image.`); return; }
    if (file.size / (1024 * 1024) > 20) { toast.error('File too large — max 20 MB.'); return; }
    try {
      const { url } = await upload(file);
      updateField(field, [{ url, filename: file.name }]);
      toast.success(`${label} uploaded`);
    } catch (err: any) { toast.error(err?.message || 'Upload failed.'); }
  };
  return (
    <div className="relative cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/30 p-3 text-center transition-all hover:border-primary/50" onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={isUploading} />
      {currentUrl ? (
        <>
          <img src={currentUrl} alt={label} className="mx-auto h-16 max-w-full object-contain" />
          <button onClick={e => { e.stopPropagation(); updateField(field, null); toast.success(`${label} removed`); }}
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:scale-110">
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <div className="flex h-16 items-center justify-center"><ImageIcon className="h-7 w-7 text-muted-foreground/30" /></div>
      )}
      <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <Upload className="h-3 w-3" />{isUploading ? 'Uploading…' : `Upload ${label.toLowerCase()}`}
      </p>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-3.5 w-3.5 text-primary" /></div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {children}
    </div>
  );
}

/* ─── Layout config ─── */
const LAYOUTS = [
  { value: 'Logo Left', label: 'Logo Left', desc: 'Side-by-side' },
  { value: 'Stacked', label: 'Stacked', desc: 'Vertical' },
  { value: 'Compact', label: 'Compact', desc: 'One-line' },
];
const FONTS = ['Arial', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Courier New'];
const SOCIAL_FIELDS = [
  { field: 'linkedInUrl', label: 'LinkedIn' }, { field: 'instagramUrl', label: 'Instagram' },
  { field: 'facebookUrl', label: 'Facebook' }, { field: 'threadsUrl', label: 'Threads' },
  { field: 'xUrl', label: 'X (Twitter)' }, { field: 'tikTokUrl', label: 'TikTok' },
  { field: 'youTubeUrl', label: 'YouTube' }, { field: 'substackUrl', label: 'Substack' },
];

/* ─── Summaries ─── */
function nameSummary(sig: SigData) {
  const name = sig.fullName || 'Not set';
  const sz = sig.nameSize || ((sig.baseTextSize || 14) + 4);
  return `${name} — ${sz}px${sig.nameBold !== false ? ', bold' : ''}`;
}
function companySummary(sig: SigData) {
  if (!sig.company) return 'Not set';
  return `${sig.company} — ${sig.companySize || 13}px${sig.companyBold ? ', bold' : ''}${sig.companyUppercase ? ', uppercase' : ''}`;
}
function taglineSummary(sig: SigData) {
  if (!sig.tagline) return 'Not set';
  const sz = sig.taglineSize || ((sig.baseTextSize || 14) - 2);
  return `${sig.tagline.slice(0, 30)}${sig.tagline.length > 30 ? '…' : ''} — ${sz}px${sig.taglineUppercase !== false ? ', uppercase' : ''}`;
}
function contactsSummary(sig: SigData) {
  const n = [sig.emailAddress, sig.phone, sig.website].filter(Boolean).length;
  const style = sig.contactIconStyle || 'filled';
  return `${n} item${n !== 1 ? 's' : ''}, ${style.replace('_', ' ')} icons`;
}
function logoSummary(sig: SigData) {
  if (!sig.logo?.[0]?.url) return 'No logo';
  return `${sig.logoSize || 96}px ${sig.logoShape || 'square'}`;
}
function bannerSummary(sig: SigData) {
  if (!sig.bannerImage?.[0]?.url) return 'No banner';
  return `${sig.bannerSize || 180}px wide`;
}
function socialsSummary(sig: SigData) {
  const n = SOCIAL_FIELDS.filter(s => sig[s.field]).length;
  return `${n} connected`;
}
function ctaSummary(sig: SigData) {
  if (!sig.showCta) return 'Off';
  return sig.ctaText || 'No text set';
}
function disclaimerSummary(sig: SigData) {
  if (!sig.showDisclaimer) return 'Off';
  return `On, ${sig.disclaimerSize || 10}px`;
}

const DEFAULTS: Record<string, any> = {
  layout: 'Logo Left', accentColor: '#111111', textColor: '#333333', headingFont: 'Arial', bodyFont: 'Arial',
  logoSize: 96, bannerSize: 180, baseTextSize: 14, showDivider: true, roundSocialIcons: true,
  companySize: 13, companyColor: '', companyBold: false, companyItalic: false, companyUppercase: false, companyLetterSpacing: 0,
  socialIconSize: 24, contactIconStyle: 'dark_mode_safe',
  blockSpacing: 8, logoAlignment: 'top', contactLayout: 'stacked', showNameAccentBar: true,
  nameSize: 0, nameColor: '', nameBold: true, jobTitleSize: 0, jobTitleColor: '', jobTitleItalic: false,
  nameTitleSeparator: 'pipe', logoShape: 'square', dividerColor: '#dddddd', dividerThickness: 1,
  showCta: false, ctaBackgroundColor: '', ctaTextColor: '#ffffff', showDisclaimer: false, disclaimerSize: 10,
  taglineSize: 0, taglineColor: '', taglineBold: false, taglineItalic: false, taglineUppercase: true, taglineLetterSpacing: 1,
};

/* ─── Main component ─── */
export default function EditTab({ sig, updateField, activeBlock, onActiveBlockChange }: {
  sig: SigData;
  updateField: (k: string, v: any) => void;
  activeBlock: string;
  onActiveBlockChange: (v: string) => void;
}) {
  const fontSize = sig.baseTextSize || 14;
  const zones = getZones(sig);
  const isCompact = sig.layout === 'Compact';

  const handlePreset = (preset: string) => {
    updateField('layout', preset);
    updateField('layoutZones', JSON.stringify(PRESET_ZONES[preset]));
  };
  const handleZonesChange = (z: ZonesConfig) => updateField('layoutZones', JSON.stringify(z));
  const resetDefaults = () => {
    Object.entries(DEFAULTS).forEach(([k, v]) => updateField(k, v));
    updateField('layoutZones', JSON.stringify(PRESET_ZONES['Logo Left']));
  };

  return (
    <div className="space-y-5">
      {/* ── Layout ── */}
      <SectionCard icon={LayoutGrid} title="Layout">
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS.map(l => (
            <button key={l.value} onClick={() => handlePreset(l.value)}
              className={`rounded-lg border-2 p-2.5 text-left transition-all ${sig.layout === l.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/30'}`}>
              <p className="text-xs font-medium text-foreground">{l.label}</p>
              <p className="text-[10px] text-muted-foreground">{l.desc}</p>
            </button>
          ))}
        </div>
        {!isCompact && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">Drag blocks between zones</p>
            <BlockArranger zones={zones} onChange={handleZonesChange} />
          </div>
        )}
      </SectionCard>

      {/* ── Block accordion ── */}
      <Accordion type="single" collapsible value={activeBlock} onValueChange={onActiveBlockChange} className="space-y-2">
        {/* Name & Title */}
        <AccordionItem value="name" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Name & Title</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{nameSummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Full name" value={sig.fullName} field="fullName" updateField={updateField} />
                <Field label="Job title" value={sig.jobTitle} field="jobTitle" updateField={updateField} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SliderRow label="Name size" value={sig.nameSize || fontSize + 4} min={12} max={28} step={1} onChange={v => updateField('nameSize', v)} />
                <SliderRow label="Title size" value={sig.jobTitleSize || fontSize} min={10} max={22} step={1} onChange={v => updateField('jobTitleSize', v)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><Label className="mb-1 block text-xs text-muted-foreground">Name color</Label><ColorPicker value={sig.nameColor || ''} onChange={v => updateField('nameColor', v)} placeholder="Accent" /></div>
                <div><Label className="mb-1 block text-xs text-muted-foreground">Title color</Label><ColorPicker value={sig.jobTitleColor || ''} onChange={v => updateField('jobTitleColor', v)} placeholder="Text" /></div>
              </div>
              <Select value={sig.nameTitleSeparator || 'pipe'} onValueChange={v => updateField('nameTitleSeparator', v)}>
                <SelectTrigger><SelectValue placeholder="Separator" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pipe">Pipe |</SelectItem><SelectItem value="bullet">Bullet ·</SelectItem>
                  <SelectItem value="dash">Dash —</SelectItem><SelectItem value="new_line">New line</SelectItem>
                </SelectContent>
              </Select>
              <ToggleRow label="Bold name" checked={sig.nameBold !== false} onChange={v => updateField('nameBold', v)} />
              <ToggleRow label="Italic title" checked={sig.jobTitleItalic ?? false} onChange={v => updateField('jobTitleItalic', v)} />
              <ToggleRow label="Accent bar" checked={sig.showNameAccentBar !== false} onChange={v => updateField('showNameAccentBar', v)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Company */}
        <AccordionItem value="company" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Company</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{companySummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <Field label="Company name" value={sig.company} field="company" updateField={updateField} />
              <SliderRow label="Size" value={sig.companySize || 13} min={9} max={18} step={1} onChange={v => updateField('companySize', v)} />
              <div><Label className="mb-1 block text-xs text-muted-foreground">Color</Label><ColorPicker value={sig.companyColor || ''} onChange={v => updateField('companyColor', v)} placeholder="Inherits text" /></div>
              <ToggleRow label="Bold" checked={sig.companyBold ?? false} onChange={v => updateField('companyBold', v)} />
              <ToggleRow label="Italic" checked={sig.companyItalic ?? false} onChange={v => updateField('companyItalic', v)} />
              <ToggleRow label="Uppercase" checked={sig.companyUppercase ?? false} onChange={v => updateField('companyUppercase', v)} />
              <SliderRow label="Letter spacing" value={sig.companyLetterSpacing ?? 0} min={0} max={5} step={0.5} unit=" px" onChange={v => updateField('companyLetterSpacing', v)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tagline */}
        <AccordionItem value="tagline" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><Quote className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Tagline</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{taglineSummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <Field label="Tagline" value={sig.tagline} field="tagline" updateField={updateField} />
              <SliderRow label="Size" value={sig.taglineSize || fontSize - 2} min={8} max={18} step={1} onChange={v => updateField('taglineSize', v)} />
              <div><Label className="mb-1 block text-xs text-muted-foreground">Color</Label><ColorPicker value={sig.taglineColor || ''} onChange={v => updateField('taglineColor', v)} placeholder="Inherits accent" /></div>
              <ToggleRow label="Bold" checked={sig.taglineBold ?? false} onChange={v => updateField('taglineBold', v)} />
              <ToggleRow label="Italic" checked={sig.taglineItalic ?? false} onChange={v => updateField('taglineItalic', v)} />
              <ToggleRow label="Uppercase" checked={sig.taglineUppercase !== false} onChange={v => updateField('taglineUppercase', v)} />
              <SliderRow label="Letter spacing" value={sig.taglineLetterSpacing ?? 1} min={0} max={5} step={0.5} unit=" px" onChange={v => updateField('taglineLetterSpacing', v)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contacts */}
        <AccordionItem value="contacts" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Contacts</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{contactsSummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Email" value={sig.emailAddress} field="emailAddress" updateField={updateField} />
                <Field label="Phone" value={sig.phone} field="phone" updateField={updateField} />
              </div>
              <Field label="Website" value={sig.website} field="website" updateField={updateField} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Icon style</Label>
                  <Select value={sig.contactIconStyle || 'filled'} onValueChange={v => updateField('contactIconStyle', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filled">Filled</SelectItem><SelectItem value="outlined">Outlined</SelectItem>
                      <SelectItem value="dark_mode_safe">Dark mode safe</SelectItem><SelectItem value="none">No icons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Layout</Label>
                  <Select value={sig.contactLayout || 'stacked'} onValueChange={v => updateField('contactLayout', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stacked">Stacked</SelectItem><SelectItem value="two_column">Two column</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Logo */}
        <AccordionItem value="logo" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><ImagePlus className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Logo</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{logoSummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <Img label="Logo" field="logo" currentUrl={sig.logo?.[0]?.url} updateField={updateField} />
              <Field label="Logo link URL" value={sig.logoLinkUrl} field="logoLinkUrl" updateField={updateField} placeholder="Makes logo clickable" />
              <SliderRow label="Size" value={sig.logoSize || 96} min={32} max={160} step={4} onChange={v => updateField('logoSize', v)} />
              <div>
                <Label className="text-xs text-muted-foreground">Shape</Label>
                <Select value={sig.logoShape || 'square'} onValueChange={v => updateField('logoShape', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="square">Square</SelectItem><SelectItem value="rounded">Rounded</SelectItem><SelectItem value="circle">Circle</SelectItem></SelectContent>
                </Select>
              </div>
              {!isCompact && (
                <div>
                  <Label className="text-xs text-muted-foreground">Alignment</Label>
                  <Select value={sig.logoAlignment || 'top'} onValueChange={v => updateField('logoAlignment', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="top">Top</SelectItem><SelectItem value="middle">Middle</SelectItem><SelectItem value="bottom">Bottom</SelectItem></SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Banner */}
        <AccordionItem value="banner" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Banner</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{bannerSummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <Img label="Banner" field="bannerImage" currentUrl={sig.bannerImage?.[0]?.url} updateField={updateField} />
              <Field label="Banner link URL" value={sig.bannerLinkUrl} field="bannerLinkUrl" updateField={updateField} placeholder="Makes banner clickable" />
              <SliderRow label="Width" value={sig.bannerSize || 180} min={100} max={400} step={10} onChange={v => updateField('bannerSize', v)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Social Links */}
        <AccordionItem value="socials" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Social Links</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{socialsSummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SOCIAL_FIELDS.map(s => (
                  <div key={s.field}>
                    <Label className="text-[11px] text-muted-foreground">{s.label}</Label>
                    <Input value={sig[s.field] || ''} onChange={e => updateField(s.field, e.target.value)} placeholder={`${s.label} URL`} className="mt-0.5 h-8 text-sm" />
                  </div>
                ))}
              </div>
              <SliderRow label="Icon size" value={sig.socialIconSize || 24} min={16} max={40} step={2} onChange={v => updateField('socialIconSize', v)} />
              <ToggleRow label="Round icons" checked={sig.roundSocialIcons !== false} onChange={v => updateField('roundSocialIcons', v)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CTA */}
        <AccordionItem value="cta" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><MousePointerClick className="h-4 w-4 text-primary" /><span className="text-sm font-medium">CTA Button</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{ctaSummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <ToggleRow label="Show button" checked={sig.showCta ?? false} onChange={v => updateField('showCta', v)} />
              {sig.showCta && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Button text" value={sig.ctaText} field="ctaText" updateField={updateField} placeholder="Book a Meeting" />
                    <Field label="Button URL" value={sig.ctaUrl} field="ctaUrl" updateField={updateField} placeholder="https://..." />
                  </div>
                  <div><Label className="mb-1 block text-xs text-muted-foreground">Background</Label><ColorPicker value={sig.ctaBackgroundColor || ''} onChange={v => updateField('ctaBackgroundColor', v)} placeholder="Accent" /></div>
                  <div><Label className="mb-1 block text-xs text-muted-foreground">Text color</Label><ColorPicker value={sig.ctaTextColor || '#ffffff'} onChange={v => updateField('ctaTextColor', v)} /></div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Disclaimer */}
        <AccordionItem value="disclaimer" className="rounded-xl border border-border bg-card px-4 shadow-sm">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Disclaimer</span></div>
            <span className="mr-2 text-[11px] text-muted-foreground">{disclaimerSummary(sig)}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-1">
              <ToggleRow label="Show disclaimer" checked={sig.showDisclaimer ?? false} onChange={v => updateField('showDisclaimer', v)} />
              {sig.showDisclaimer && (
                <>
                  <Textarea value={sig.disclaimerText || ''} onChange={e => updateField('disclaimerText', e.target.value)} placeholder="This email is confidential..." rows={3} className="text-sm" />
                  <SliderRow label="Size" value={sig.disclaimerSize || 10} min={8} max={14} step={1} onChange={v => updateField('disclaimerSize', v)} />
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ── Theme ── */}
      <SectionCard icon={Palette} title="Theme">
        <div className="space-y-4">
          <div><Label className="mb-1 block text-xs text-muted-foreground">Accent color</Label><ColorPicker value={sig.accentColor || '#111111'} onChange={v => updateField('accentColor', v)} /></div>
          <div><Label className="mb-1 block text-xs text-muted-foreground">Text color</Label><ColorPicker value={sig.textColor || '#333333'} onChange={v => updateField('textColor', v)} /></div>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SliderRow label="Base text size" value={sig.baseTextSize || 14} min={10} max={20} step={1} onChange={v => updateField('baseTextSize', v)} />
            <SliderRow label="Block spacing" value={sig.blockSpacing ?? 8} min={2} max={20} step={1} onChange={v => updateField('blockSpacing', v)} />
          </div>
          <div><Label className="mb-1 block text-xs text-muted-foreground">Divider color</Label><ColorPicker value={sig.dividerColor || '#dddddd'} onChange={v => updateField('dividerColor', v)} /></div>
          <SliderRow label="Divider thickness" value={sig.dividerThickness ?? 1} min={1} max={4} step={1} onChange={v => updateField('dividerThickness', v)} />
          <ToggleRow label="Vertical bar between columns" checked={sig.showDivider !== false} onChange={v => updateField('showDivider', v)} />
        </div>
      </SectionCard>

      <Button variant="outline" onClick={resetDefaults} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset all</Button>
    </div>
  );
}
