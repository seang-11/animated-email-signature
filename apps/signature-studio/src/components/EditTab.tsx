import { useRef, useState, useEffect, useMemo } from 'react';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Slider } from '@project/components/ui/slider';
import { Switch } from '@project/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Button } from '@project/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@project/components/ui/accordion';
import {
  RotateCcw, LayoutGrid, Palette, User, Building2, Quote, Mail, Image as ImageIcon,
  ImagePlus, Share2, MousePointerClick, Upload, X, AlertCircle, Check, ChevronDown,
} from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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

/* ─── Chunky slider with value bubble ─── */
function SliderRow({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}{unit || ' px'}</span>
      </div>
      <div className="relative">
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-9 z-10 pointer-events-none"
              style={{ left: `${((value - min) / (max - min)) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <div className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-md">
                {value}{unit || ' px'}
              </div>
              <div className="mx-auto h-1.5 w-1.5 rotate-45 bg-primary -mt-0.5" />
            </motion.div>
          )}
        </AnimatePresence>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          min={min}
          max={max}
          step={step}
          className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_[role=slider]]:shadow-md [&_[data-orientation=horizontal]>[data-orientation=horizontal]]:h-2.5"
        />
      </div>
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
  if (!sig.ctaText) return 'Off';
  if (!sig.ctaUrl) return 'Add a link';
  return sig.ctaText;
}

/* ─── Section completion ─── */
function isSectionFilled(key: string, sig: SigData): boolean {
  switch (key) {
    case 'name': return !!(sig.fullName);
    case 'company': return !!(sig.company);
    case 'tagline': return !!(sig.tagline);
    case 'contacts': return !!(sig.emailAddress || sig.phone || sig.website);
    case 'logo': return !!(sig.logo?.[0]?.url);
    case 'banner': return !!(sig.bannerImage?.[0]?.url);
    case 'socials': return SOCIAL_FIELDS.some(s => sig[s.field]);
    case 'cta': return !!(sig.ctaText && sig.ctaUrl);
    default: return false;
  }
}

const DEFAULTS: Record<string, any> = {
  layout: 'Logo Left', accentColor: '#111111', textColor: '#333333', headingFont: 'Arial', bodyFont: 'Arial',
  logoSize: 96, bannerSize: 180, baseTextSize: 14, showDivider: true, roundSocialIcons: true,
  companySize: 13, companyColor: '', companyBold: false, companyItalic: false, companyUppercase: false, companyLetterSpacing: 0,
  socialIconSize: 24, contactIconStyle: 'dark_mode_safe',
  blockSpacing: 8, logoAlignment: 'top', contactLayout: 'stacked', showNameAccentBar: true,
  accentBarColor: '', accentBarThickness: 3,
  nameSize: 0, nameColor: '', nameBold: true, jobTitleSize: 0, jobTitleColor: '', jobTitleItalic: false,
  nameTitleSeparator: 'pipe', logoShape: 'square', dividerColor: '#dddddd', dividerThickness: 1,
  ctaBackgroundColor: '', ctaTextColor: '#ffffff',
  taglineSize: 0, taglineColor: '', taglineBold: false, taglineItalic: false, taglineUppercase: true, taglineLetterSpacing: 1,
};

/* ─── Animated section header ─── */
type SectionDef = { key: string; icon: React.ElementType; label: string; summary: (sig: SigData) => string };

const SECTIONS: SectionDef[] = [
  { key: 'name', icon: User, label: 'Name & Title', summary: nameSummary },
  { key: 'company', icon: Building2, label: 'Company', summary: companySummary },
  { key: 'tagline', icon: Quote, label: 'Tagline', summary: taglineSummary },
  { key: 'contacts', icon: Mail, label: 'Contacts', summary: contactsSummary },
  { key: 'logo', icon: ImagePlus, label: 'Logo', summary: logoSummary },
  { key: 'banner', icon: ImageIcon, label: 'Banner', summary: bannerSummary },
  { key: 'socials', icon: Share2, label: 'Social Links', summary: socialsSummary },
  { key: 'cta', icon: MousePointerClick, label: 'CTA Button', summary: ctaSummary },
];

function SectionHeader({ section, sig, filled, justFilled }: { section: SectionDef; sig: SigData; filled: boolean; justFilled: boolean }) {
  const Icon = section.icon;
  return (
    <div className="flex items-center gap-2 w-full">
      <motion.div
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${filled ? 'bg-primary' : 'bg-muted'}`}
        animate={justFilled ? { scale: [1, 1.25, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Icon className={`h-4 w-4 ${filled ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
      </motion.div>
      <span className="text-sm font-medium">{section.label}</span>
      <AnimatePresence>
        {filled && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500"
          >
            <Check className="h-3 w-3 text-white" />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="ml-auto mr-2 text-[11px] text-muted-foreground">{section.summary(sig)}</span>
    </div>
  );
}

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

  // Track completion for pulse animation
  const filledMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const s of SECTIONS) m[s.key] = isSectionFilled(s.key, sig);
    return m;
  }, [sig]);

  const prevFilled = useRef<Record<string, boolean>>({});
  const [justFilled, setJustFilled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newJust: Record<string, boolean> = {};
    let any = false;
    for (const s of SECTIONS) {
      if (filledMap[s.key] && !prevFilled.current[s.key]) {
        newJust[s.key] = true;
        any = true;
      }
    }
    prevFilled.current = filledMap;
    if (any) {
      setJustFilled(newJust);
      const t = setTimeout(() => setJustFilled({}), 500);
      return () => clearTimeout(t);
    }
  }, [filledMap]);

  // Divider sub-section open state
  const [dividerOpen, setDividerOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* ── Theme — always open at top ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Palette className="h-4 w-4 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Theme</p>
        </div>

        <div className="space-y-5">
          {/* Accent color */}
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Accent color</Label>
            <ColorPicker value={sig.accentColor || '#111111'} onChange={v => updateField('accentColor', v)} />
          </div>

          {/* Text color */}
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Text color</Label>
            <ColorPicker value={sig.textColor || '#333333'} onChange={v => updateField('textColor', v)} />
          </div>

          {/* Font pickers with self-rendering options */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Heading font</Label>
              <Select value={sig.headingFont || 'Arial'} onValueChange={v => updateField('headingFont', v)}>
                <SelectTrigger className="mt-1" style={{ fontFamily: `${sig.headingFont || 'Arial'}, sans-serif` }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: `${f}, sans-serif` }}>{f}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Body font</Label>
              <Select value={sig.bodyFont || 'Arial'} onValueChange={v => updateField('bodyFont', v)}>
                <SelectTrigger className="mt-1" style={{ fontFamily: `${sig.bodyFont || 'Arial'}, sans-serif` }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: `${f}, sans-serif` }}>{f}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Size sliders */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SliderRow label="Base text size" value={sig.baseTextSize || 14} min={10} max={20} step={1} onChange={v => updateField('baseTextSize', v)} />
            <SliderRow label="Block spacing" value={sig.blockSpacing ?? 8} min={2} max={20} step={1} onChange={v => updateField('blockSpacing', v)} />
          </div>

          {/* Collapsible divider sub-group */}
          <div className="rounded-lg border border-border">
            <button
              onClick={() => setDividerOpen(!dividerOpen)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Column divider settings</span>
              <motion.div animate={{ rotate: dividerOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {dividerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 px-3 pb-3">
                    <div><Label className="mb-1 block text-xs text-muted-foreground">Divider &amp; separator color</Label><ColorPicker value={sig.dividerColor || '#dddddd'} onChange={v => updateField('dividerColor', v)} /></div>
                    <SliderRow label="Divider thickness" value={sig.dividerThickness ?? 1} min={1} max={4} step={1} onChange={v => updateField('dividerThickness', v)} />
                    <ToggleRow label="Show column divider" checked={sig.showDivider !== false} onChange={v => updateField('showDivider', v)} />
                    <p className="text-[11px] text-muted-foreground">This color also sets the separator between your name and job title.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Layout ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04 }}
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LayoutGrid className="h-4 w-4 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Layout</p>
        </div>
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
      </motion.div>

      {/* ── Block accordion — staggered entry ── */}
      <Accordion type="single" collapsible value={activeBlock} onValueChange={onActiveBlockChange} className="space-y-2">
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 + i * 0.04 }}
          >
            <AccordionItem
              value={section.key}
              className="rounded-xl border border-border bg-card px-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 group"
            >
              <AccordionTrigger className="py-3 hover:no-underline [&>svg]:transition-transform [&>svg]:duration-200">
                <SectionHeader section={section} sig={sig} filled={filledMap[section.key]} justFilled={!!justFilled[section.key]} />
              </AccordionTrigger>
              <AccordionContent>
                <SectionBody sectionKey={section.key} sig={sig} updateField={updateField} fontSize={fontSize} isCompact={isCompact} />
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>

      <Button variant="outline" onClick={resetDefaults} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset all</Button>
    </div>
  );
}

/* ─── Section body (keeps the main component lean) ─── */
function SectionBody({ sectionKey, sig, updateField, fontSize, isCompact }: {
  sectionKey: string; sig: SigData; updateField: (k: string, v: any) => void; fontSize: number; isCompact: boolean;
}) {
  switch (sectionKey) {
    case 'name': return <NameBody sig={sig} updateField={updateField} fontSize={fontSize} />;
    case 'company': return <CompanyBody sig={sig} updateField={updateField} />;
    case 'tagline': return <TaglineBody sig={sig} updateField={updateField} fontSize={fontSize} />;
    case 'contacts': return <ContactsBody sig={sig} updateField={updateField} />;
    case 'logo': return <LogoBody sig={sig} updateField={updateField} isCompact={isCompact} />;
    case 'banner': return <BannerBody sig={sig} updateField={updateField} />;
    case 'socials': return <SocialsBody sig={sig} updateField={updateField} />;
    case 'cta': return <CtaBody sig={sig} updateField={updateField} />;
    default: return null;
  }
}

function NameBody({ sig, updateField, fontSize }: { sig: SigData; updateField: (k: string, v: any) => void; fontSize: number }) {
  return (
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
      {sig.showNameAccentBar !== false && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-[11px] text-muted-foreground">One bar runs alongside the name, company and tagline together.</p>
          <div><Label className="mb-1 block text-xs text-muted-foreground">Bar color</Label><ColorPicker value={sig.accentBarColor || ''} onChange={v => updateField('accentBarColor', v)} placeholder="Accent" /></div>
          <SliderRow label="Bar width" value={sig.accentBarThickness ?? 3} min={1} max={10} step={1} onChange={v => updateField('accentBarThickness', v)} />
        </div>
      )}
    </div>
  );
}

function CompanyBody({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3 pb-1">
      <Field label="Company name" value={sig.company} field="company" updateField={updateField} />
      <SliderRow label="Size" value={sig.companySize || 13} min={9} max={18} step={1} onChange={v => updateField('companySize', v)} />
      <div><Label className="mb-1 block text-xs text-muted-foreground">Color</Label><ColorPicker value={sig.companyColor || ''} onChange={v => updateField('companyColor', v)} placeholder="Inherits text" /></div>
      <ToggleRow label="Bold" checked={sig.companyBold ?? false} onChange={v => updateField('companyBold', v)} />
      <ToggleRow label="Italic" checked={sig.companyItalic ?? false} onChange={v => updateField('companyItalic', v)} />
      <ToggleRow label="Uppercase" checked={sig.companyUppercase ?? false} onChange={v => updateField('companyUppercase', v)} />
      <SliderRow label="Letter spacing" value={sig.companyLetterSpacing ?? 0} min={0} max={5} step={0.5} unit=" px" onChange={v => updateField('companyLetterSpacing', v)} />
    </div>
  );
}

function TaglineBody({ sig, updateField, fontSize }: { sig: SigData; updateField: (k: string, v: any) => void; fontSize: number }) {
  return (
    <div className="space-y-3 pb-1">
      <Field label="Tagline" value={sig.tagline} field="tagline" updateField={updateField} />
      <SliderRow label="Size" value={sig.taglineSize || fontSize - 2} min={8} max={18} step={1} onChange={v => updateField('taglineSize', v)} />
      <div><Label className="mb-1 block text-xs text-muted-foreground">Color</Label><ColorPicker value={sig.taglineColor || ''} onChange={v => updateField('taglineColor', v)} placeholder="Inherits accent" /></div>
      <ToggleRow label="Bold" checked={sig.taglineBold ?? false} onChange={v => updateField('taglineBold', v)} />
      <ToggleRow label="Italic" checked={sig.taglineItalic ?? false} onChange={v => updateField('taglineItalic', v)} />
      <ToggleRow label="Uppercase" checked={sig.taglineUppercase !== false} onChange={v => updateField('taglineUppercase', v)} />
      <SliderRow label="Letter spacing" value={sig.taglineLetterSpacing ?? 1} min={0} max={5} step={0.5} unit=" px" onChange={v => updateField('taglineLetterSpacing', v)} />
    </div>
  );
}

function ContactsBody({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  return (
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
  );
}

function LogoBody({ sig, updateField, isCompact }: { sig: SigData; updateField: (k: string, v: any) => void; isCompact: boolean }) {
  return (
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
  );
}

function BannerBody({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3 pb-1">
      <Img label="Banner" field="bannerImage" currentUrl={sig.bannerImage?.[0]?.url} updateField={updateField} />
      <Field label="Banner link URL" value={sig.bannerLinkUrl} field="bannerLinkUrl" updateField={updateField} placeholder="Makes banner clickable" />
      <SliderRow label="Width" value={sig.bannerSize || 180} min={100} max={400} step={10} onChange={v => updateField('bannerSize', v)} />
    </div>
  );
}

function SocialsBody({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  return (
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
  );
}

function CtaBody({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3 pb-1">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Button text" value={sig.ctaText} field="ctaText" updateField={updateField} placeholder="Book a Meeting" />
        <Field label="Button URL" value={sig.ctaUrl} field="ctaUrl" updateField={updateField} placeholder="https://..." />
      </div>
      {sig.ctaText && !sig.ctaUrl && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          Add a link to make this button appear in your signature.
        </div>
      )}
      <div><Label className="mb-1 block text-xs text-muted-foreground">Background</Label><ColorPicker value={sig.ctaBackgroundColor || ''} onChange={v => updateField('ctaBackgroundColor', v)} placeholder="Accent" /></div>
      <div><Label className="mb-1 block text-xs text-muted-foreground">Text color</Label><ColorPicker value={sig.ctaTextColor || '#ffffff'} onChange={v => updateField('ctaTextColor', v)} /></div>
    </div>
  );
}
