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
  ImagePlus, Share2, MousePointerClick, Upload, X, AlertCircle, Check, ChevronDown, GripVertical,
} from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { SigData } from './SignatureEditor';
import ColorPicker from './ColorPicker';
import BlockArranger from './BlockArranger';
import InfoTip from './InfoTip';
import { FONTS as FONT_DEFS, FONT_GROUPS, fontStack } from '../utils/fonts';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getZones, PRESET_ZONES, flattenZones, moveBlock, ZONE_LABELS, type ZonesConfig, type BlockId, type ZoneId } from '../utils/zones';

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

function ZonesExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <span>💡 How zones & layouts work</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3 w-3" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-3 pb-3 text-[11px] leading-relaxed text-muted-foreground">
              <p>Your signature is divided into three <strong className="text-foreground">zones</strong>:</p>
              <ul className="space-y-1.5 pl-3">
                <li><strong className="text-foreground">Left</strong> — a sidebar column, perfect for your logo. Sits side-by-side with Main.</li>
                <li><strong className="text-foreground">Main</strong> — the primary column where most of your info lives: name, company, contacts, socials.</li>
                <li><strong className="text-foreground">Bottom</strong> — spans the full width underneath. Great for banners, legal text, or taglines.</li>
              </ul>
              <p className="pt-1"><strong className="text-foreground">Reordering within a zone</strong> changes the top-to-bottom order of items in that column. <strong className="text-foreground">Moving between zones</strong> changes where a block appears structurally (e.g. moving Logo from Main to Left makes it a sidebar).</p>
              <p className="pt-1"><strong className="text-foreground">Presets:</strong></p>
              <ul className="space-y-1 pl-3">
                <li><strong className="text-foreground">Logo Left</strong> — classic look with logo in a sidebar and everything else in the main column.</li>
                <li><strong className="text-foreground">Stacked</strong> — everything in a single vertical column, no sidebar.</li>
                <li><strong className="text-foreground">Compact</strong> — minimal layout, just logo + name + company + contacts.</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LAYOUTS = [
  { value: 'Logo Left', label: 'Logo Left', desc: 'Side-by-side' },
  { value: 'Stacked', label: 'Stacked', desc: 'Vertical' },
  { value: 'Compact', label: 'Compact', desc: 'One-line' },
];
/* Grouped font dropdown options */
function FontOptions() {
  useEffect(() => {
    for (const f of FONT_DEFS) {
      if (f.googleImport && !document.querySelector(`link[href="${f.googleImport}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = f.googleImport;
        document.head.appendChild(link);
      }
    }
  }, []);
  return (
    <>
      {FONT_GROUPS.map(g => {
        const fonts = FONT_DEFS.filter(f => f.group === g.key);
        if (!fonts.length) return null;
        return (
          <div key={g.key}>
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</div>
            {fonts.map(f => (
              <SelectItem key={f.name} value={f.name}>
                <span style={{ fontFamily: f.stack }}>{f.name}</span>
                {f.googleImport && <span className="ml-1.5 text-[10px] text-muted-foreground/60">⚠ fallback</span>}
              </SelectItem>
            ))}
          </div>
        );
      })}
    </>
  );
}

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

function SectionHeader({ section, sig, filled, justFilled, zoneLabel }: { section: SectionDef; sig: SigData; filled: boolean; justFilled: boolean; zoneLabel?: string }) {
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
      {zoneLabel && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground" title="This block is placed in a special zone. Use the Layout panel or drag it in the preview to move it.">
          {zoneLabel}
        </span>
      )}
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

/* ─── Sortable section card ─── */
function SortableSection({
  section, sig, filled, justFilled, zoneLabel, index, updateField, fontSize, isCompact,
}: {
  section: SectionDef; sig: SigData; filled: boolean; justFilled: boolean; zoneLabel?: string;
  index: number; updateField: (k: string, v: any) => void; fontSize: number; isCompact: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.key });
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 + index * 0.04 }}
    >
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1, position: 'relative', zIndex: isDragging ? 20 : undefined }}
      >
      <AccordionItem
        value={section.key}
        className="rounded-xl border border-border bg-card pl-2 pr-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 group"
      >
        <div className="flex items-center">
          <span
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            title="Drag to reorder in your signature"
            className="-ml-0.5 mr-1 cursor-grab rounded p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-primary active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <AccordionTrigger className="w-full py-3 hover:no-underline [&>svg]:transition-transform [&>svg]:duration-200">
              <SectionHeader section={section} sig={sig} filled={filled} justFilled={justFilled} zoneLabel={zoneLabel} />
            </AccordionTrigger>
          </div>
        </div>
        <AccordionContent>
          <SectionBody sectionKey={section.key} sig={sig} updateField={updateField} fontSize={fontSize} isCompact={isCompact} />
        </AccordionContent>
      </AccordionItem>
      </div>
    </motion.div>
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

  /* Section cards follow the real top-to-bottom order of the signature */
  const sectionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [draggingSection, setDraggingSection] = useState<string | null>(null);
  const flat = flattenZones(zones);
  const zoneOf: Record<string, ZoneId> = {};
  for (const f of flat) zoneOf[f.id] = f.zone;
  const orderedSections = [
    ...flat.map(f => SECTIONS.find(s => s.key === f.id)).filter(Boolean) as SectionDef[],
    ...SECTIONS.filter(s => !zoneOf[s.key]),
  ];

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
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [hasDragged, setHasDragged] = useState(() => {
    try { return localStorage.getItem('sig-studio-first-drag') === '1'; } catch { return false; }
  });

  return (
    <div className="space-y-4">
      {/* ── Theme — always open at top ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
        data-tour="theme"
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
            <Label className="mb-1 block text-xs text-muted-foreground">Accent color</Label>
            <p className="mb-2 text-[11px] text-muted-foreground/70">Used for your name, accent bar, CTA button, and social icon backgrounds.</p>
            <ColorPicker value={sig.accentColor || '#111111'} onChange={v => updateField('accentColor', v)} />
          </div>

          {/* Text color */}
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Text color</Label>
            <p className="mb-2 text-[11px] text-muted-foreground/70">The default color for body text — job title, company, contacts, and tagline.</p>
            <ColorPicker value={sig.textColor || '#333333'} onChange={v => updateField('textColor', v)} />
          </div>

          {/* Font pickers with grouped options */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Heading font</Label>
                <InfoTip text="Most email clients only show system-installed fonts. Preview-only fonts look great while editing but will fall back to something similar in the actual email." />
              </div>
              <Select value={sig.headingFont || 'Arial'} onValueChange={v => updateField('headingFont', v)}>
                <SelectTrigger className="mt-1" style={{ fontFamily: fontStack(sig.headingFont || 'Arial') }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <FontOptions />
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Body font</Label>
              </div>
              <Select value={sig.bodyFont || 'Arial'} onValueChange={v => updateField('bodyFont', v)}>
                <SelectTrigger className="mt-1" style={{ fontFamily: fontStack(sig.bodyFont || 'Arial') }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <FontOptions />
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Size sliders */}
          <div className="space-y-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SliderRow label="Base text size" value={sig.baseTextSize || 14} min={10} max={20} step={1} onChange={v => updateField('baseTextSize', v)} />
              <SliderRow label="Block spacing" value={sig.blockSpacing ?? 8} min={2} max={20} step={1} onChange={v => updateField('blockSpacing', v)} />
            </div>
            <p className="text-[11px] text-muted-foreground/70">Base text size sets the default for contacts and body text. Block spacing controls the gap between each part of your signature.</p>
          </div>

          {/* Collapsible divider sub-group */}
          <div className="rounded-lg border border-border">
            <button
              onClick={() => setDividerOpen(!dividerOpen)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Column divider settings</span>
              <InfoTip text="The vertical line that separates your logo column from the rest of your info. Also controls the separator color between name and title." />
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

      {/* ── Layout — collapsible ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04 }}
        className="rounded-xl border border-border bg-card shadow-sm"
        data-tour="layout"
      >
        <button
          onClick={() => setLayoutOpen(!layoutOpen)}
          className="flex w-full items-center gap-2 px-5 py-4 text-left"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LayoutGrid className="h-4 w-4 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Layout</p>
          <span className="ml-auto mr-2 text-[11px] text-muted-foreground">{sig.layout || 'Logo Left'}</span>
          <motion.div animate={{ rotate: layoutOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {layoutOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUTS.map(l => (
                    <button key={l.value} onClick={() => handlePreset(l.value)}
                      className={`rounded-lg border-2 p-2.5 text-left transition-all ${sig.layout === l.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/30'}`}>
                      <p className="text-xs font-medium text-foreground">{l.label}</p>
                      <p className="text-[10px] text-muted-foreground">{l.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Zones explainer */}
                <ZonesExplainer />

                {!isCompact && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">Drag blocks between zones</p>
                    <BlockArranger zones={zones} onChange={handleZonesChange} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Block accordion — drag the cards to reorder the signature ── */}
      <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground" data-tour="sections">
        <GripVertical className="h-3 w-3" /> Drag a card to move that part of your signature — the preview updates instantly
      </div>
      <DndContext
        sensors={sectionSensors}
        collisionDetection={closestCenter}
        onDragStart={e => setDraggingSection(e.active.id as string)}
        onDragCancel={() => setDraggingSection(null)}
        onDragEnd={e => {
          setDraggingSection(null);
          const { active, over } = e;
          if (!over || active.id === over.id) return;
          handleZonesChange(moveBlock(zones, active.id as BlockId, over.id as BlockId));
          if (!hasDragged) {
            setHasDragged(true);
            try { localStorage.setItem('sig-studio-first-drag', '1'); } catch {}
            toast('🎉 Nice! You just rearranged your signature. Drag anytime to reorder.');
          }
        }}
      >
        <SortableContext items={orderedSections.map(s => s.key)} strategy={verticalListSortingStrategy}>
          <Accordion type="single" collapsible value={activeBlock} onValueChange={onActiveBlockChange} className="space-y-2">
            {orderedSections.map((section, i) => (
              <SortableSection
                key={section.key}
                section={section}
                sig={sig}
                filled={filledMap[section.key]}
                justFilled={!!justFilled[section.key]}
                zoneLabel={zoneOf[section.key] && zoneOf[section.key] !== 'main' ? ZONE_LABELS[zoneOf[section.key]] : undefined}
                index={i}
                updateField={updateField}
                fontSize={fontSize}
                isCompact={isCompact}
              />
            ))}
          </Accordion>
        </SortableContext>
        <DragOverlay>
          {draggingSection ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-primary bg-card px-3 py-2 text-sm font-medium shadow-lg">
              <GripVertical className="h-3.5 w-3.5 text-primary" />
              {SECTIONS.find(s => s.key === draggingSection)?.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Button variant="outline" onClick={resetDefaults} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset all</Button>
    </div>
  );
}

/* ─── Section intro blurbs ─── */
const SECTION_INTROS: Record<string, string> = {
  name: "This is the most prominent part of your signature — your name and job title. Tip: keep your name bold and slightly larger than everything else so it anchors the whole block.",
  company: "Your company name appears below your name. Keep it concise — skip legal suffixes like \"Inc.\" or \"LLC\" for a cleaner look.",
  tagline: "A short phrase under your company — great for a mission statement, slogan, or department name. One line max works best.",
  contacts: "How people reach you. Most signatures include email and phone; add your website if you want people to visit it. Tip: skip \"www.\" for a cleaner look.",
  logo: "Your brand's visual identity. Square logos under 200×200px look sharpest. GIFs are supported too — animated logos really stand out!",
  banner: "A full-width image that appears below your signature — perfect for promotions, event announcements, or seasonal branding. Make it clickable with a link URL.",
  socials: "Add links to your social profiles. Only filled-in platforms show up in your signature. Paste the full profile URL (not just the username).",
  cta: "A call-to-action button that drives a specific action — booking a meeting, visiting a landing page, or downloading something. Both text and a URL are required for it to appear.",
};

function SectionIntro({ sectionKey }: { sectionKey: string }) {
  const text = SECTION_INTROS[sectionKey];
  if (!text) return null;
  return (
    <p className="mb-2 rounded-md bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
      {text}
    </p>
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
      <SectionIntro sectionKey="name" />
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
      <div className="flex items-center gap-1.5">
        <ToggleRow label="Accent bar" checked={sig.showNameAccentBar !== false} onChange={v => updateField('showNameAccentBar', v)} />
        <InfoTip text="A colored vertical bar that runs alongside your name, company, and tagline as one continuous strip — it adds a nice branded touch." />
      </div>
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
      <SectionIntro sectionKey="company" />
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
      <SectionIntro sectionKey="tagline" />
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
      <SectionIntro sectionKey="contacts" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Email" value={sig.emailAddress} field="emailAddress" updateField={updateField} />
        <Field label="Phone" value={sig.phone} field="phone" updateField={updateField} />
      </div>
      <Field label="Website" value={sig.website} field="website" updateField={updateField} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Icon style</Label>
            <InfoTip text="'Dark mode safe' uses white icons that look great on dark email backgrounds. 'No icons' shows text only." />
          </div>
          <Select value={sig.contactIconStyle || 'filled'} onValueChange={v => updateField('contactIconStyle', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="filled">Filled</SelectItem><SelectItem value="outlined">Outlined</SelectItem>
              <SelectItem value="dark_mode_safe">Dark mode safe</SelectItem><SelectItem value="none">No icons</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Layout</Label>
            <InfoTip text="Stacked shows each contact on its own line. Two-column splits them into side-by-side columns." />
          </div>
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
      <SectionIntro sectionKey="logo" />
      <Img label="Logo" field="logo" currentUrl={sig.logo?.[0]?.url} updateField={updateField} />
      <div className="rounded-lg bg-primary/5 px-3 py-2.5">
        <p className="text-[11px] font-medium text-primary">💡 Pro tip: Animated logos stand out!</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Use an AI video tool to animate your logo as an MP4, then convert it to a GIF at{' '}
          <a href="https://cloudconvert.com/mp4-to-gif" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">cloudconvert.com/mp4-to-gif</a>
          {' '}and upload the GIF here. Gmail supports animated GIF logos!
        </p>
      </div>
      <Field label="Logo link URL" value={sig.logoLinkUrl} field="logoLinkUrl" updateField={updateField} placeholder="Makes logo clickable" />
      <SliderRow label="Size" value={sig.logoSize || 96} min={32} max={160} step={4} onChange={v => updateField('logoSize', v)} />
      <div>
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Shape</Label>
          <InfoTip text="Controls how your logo is cropped — square has sharp corners, rounded softens them, and circle fits the logo in a round frame." />
        </div>
        <Select value={sig.logoShape || 'square'} onValueChange={v => updateField('logoShape', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="square">Square</SelectItem><SelectItem value="rounded">Rounded</SelectItem><SelectItem value="circle">Circle</SelectItem></SelectContent>
        </Select>
      </div>
      {!isCompact && (
        <div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Alignment</Label>
            <InfoTip text="Where the logo sits vertically next to your info — top, centered, or bottom-aligned." />
          </div>
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
      <SectionIntro sectionKey="banner" />
      <Img label="Banner" field="bannerImage" currentUrl={sig.bannerImage?.[0]?.url} updateField={updateField} />
      <Field label="Banner link URL" value={sig.bannerLinkUrl} field="bannerLinkUrl" updateField={updateField} placeholder="Makes banner clickable" />
      <SliderRow label="Width" value={sig.bannerSize || 180} min={100} max={400} step={10} onChange={v => updateField('bannerSize', v)} />
    </div>
  );
}

function SocialsBody({ sig, updateField }: { sig: SigData; updateField: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3 pb-1">
      <SectionIntro sectionKey="socials" />
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
      <SectionIntro sectionKey="cta" />
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <InfoTip text="Your CTA needs both button text and a link URL to show up in the signature. It's perfect for things like 'Book a Meeting' or 'Visit our site'." />
        Both fields required to show the button
      </p>
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
