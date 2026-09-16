import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@project/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';

/* ─── Types ─── */
export type TemplateDesign = {
  key: string;
  label: string;
  desc: string;
  overrides: Record<string, any>;
};

/* ─── Three keepers + their overrides ─── */
export const TEMPLATES: TemplateDesign[] = [
  {
    key: 'classic',
    label: 'Classic',
    desc: 'Logo left, clean and safe',
    overrides: {
      layout: 'Logo Left',
      accentColor: '#111111',
      textColor: '#333333',
      headingFont: 'Arial',
      bodyFont: 'Arial',
      logoSize: 96,
      baseTextSize: 14,
      bannerSize: 180,
      showDivider: true,
      roundSocialIcons: true,
      showNameAccentBar: true,
    },
  },
  {
    key: 'one-line',
    label: 'One Line',
    desc: 'Compact, great for replies',
    overrides: {
      layout: 'Compact',
      accentColor: '#333333',
      textColor: '#555555',
      headingFont: 'Helvetica',
      bodyFont: 'Helvetica',
      logoSize: 64,
      baseTextSize: 13,
      showDivider: true,
      roundSocialIcons: true,
      showNameAccentBar: false,
    },
  },
  {
    key: 'bold',
    label: 'Bold',
    desc: 'Accent bar, banner-led',
    overrides: {
      layout: 'Stacked',
      accentColor: '#3E6FE7',
      textColor: '#334155',
      headingFont: 'Helvetica',
      bodyFont: 'Arial',
      logoSize: 80,
      baseTextSize: 14,
      bannerSize: 200,
      showDivider: true,
      roundSocialIcons: true,
      showNameAccentBar: true,
      accentBarThickness: 4,
    },
  },
];

/* ─── Mini-signature previews ─── */
function ClassicMini({ selected }: { selected: boolean }) {
  const accent = '#111';
  return (
    <div className="rounded-lg border border-border bg-white p-3" style={{ transform: 'scale(1)', fontSize: 10 }}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300">
          <span className="text-[9px] font-bold text-gray-500">AR</span>
        </div>
        <div className="h-12 w-px flex-shrink-0 bg-gray-200" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <div className="w-0.5 self-stretch rounded-full" style={{ background: accent, minHeight: 20 }} />
            <div>
              <p className="font-bold leading-tight" style={{ color: accent, fontSize: 11 }}>Alex Rivera</p>
              <p className="leading-tight text-gray-400" style={{ fontSize: 9 }}>
                <span style={{ color: '#ccc' }}>|</span> Head of Growth
              </p>
            </div>
          </div>
          <p className="mt-0.5 text-gray-500" style={{ fontSize: 8.5 }}>Northwind Studio</p>
          <div className="mt-1.5 space-y-0.5">
            {['✉ alex@northwind.co', '☎ (555) 012-3456', '🌐 northwind.co'].map(t => (
              <p key={t} style={{ fontSize: 8, color: selected ? accent : '#888', lineHeight: '12px' }}>{t}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OneLineMini() {
  return (
    <div className="flex h-[82px] items-center rounded-lg border border-border bg-white px-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-gray-200">
          <span className="text-[7px] font-bold text-gray-500">AR</span>
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div style={{ fontSize: 9 }}>
          <span className="font-semibold text-gray-700">Alex Rivera</span>
          <span className="text-gray-400"> | Head of Growth | </span>
          <span style={{ color: '#333' }}>alex@northwind.co</span>
        </div>
      </div>
    </div>
  );
}

function BoldMini({ selected }: { selected: boolean }) {
  const accent = '#3E6FE7';
  return (
    <div className="rounded-lg border border-border bg-white p-3" style={{ fontSize: 10 }}>
      <div className="flex gap-2">
        <div className="w-1 flex-shrink-0 rounded" style={{ background: accent, minHeight: 24 }} />
        <div>
          <p className="font-bold leading-tight" style={{ color: '#111', fontSize: 12 }}>Alex Rivera</p>
          <p className="leading-tight" style={{ fontSize: 9, color: '#64748b' }}>Head of Growth</p>
          <p className="mt-0.5" style={{ fontSize: 8.5, color: '#64748b' }}>Northwind Studio</p>
        </div>
      </div>
      <div className="mt-2 flex h-5 items-center rounded" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}>
        <span className="px-2 text-white" style={{ fontSize: 7, fontWeight: 600 }}>🎯 Book a Call</span>
      </div>
      <div className="mt-1.5 flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: selected ? accent : '#ddd' }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Confetti burst ─── */
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * 360;
    const dist = 40 + Math.random() * 30;
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#3E6FE7', '#FF85A1', '#7C3AED'];
    return { angle, dist, color: colors[i % colors.length], size: 4 + Math.random() * 4 };
  });
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
            y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ─── Tilt card wrapper ─── */
function TiltCard({
  children,
  selected,
  onClick,
  delay,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const x = ((e.clientY - cy) / (r.height / 2)) * -6;
    const y = ((e.clientX - cx) / (r.width / 2)) * 6;
    setTilt({ x, y });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 22 }}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setTilt({ x: 0, y: 0 }); }}
      onClick={onClick}
      className="relative cursor-pointer"
      style={{
        perspective: 600,
      }}
    >
      <motion.div
        animate={{
          rotateX: hovering ? tilt.x : 0,
          rotateY: hovering ? tilt.y : 0,
          scale: selected ? 1.04 : hovering ? 1.02 : 1,
          y: hovering ? -4 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative rounded-2xl border-2 p-4 transition-shadow duration-300 ${
          selected
            ? 'border-primary bg-card shadow-xl shadow-primary/20 ring-2 ring-primary/30'
            : 'border-border bg-card hover:border-primary/40 hover:shadow-lg'
        }`}
      >
        <Confetti active={selected} />
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ─── Main gallery ─── */
interface TemplateGalleryProps {
  onSelect: (template: TemplateDesign | null) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export default function TemplateGallery({ onSelect, onCancel, showCancel }: TemplateGalleryProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUse = async () => {
    if (!selected) return;
    setLoading(true);
    if (selected === 'blank') { onSelect(null); return; }
    const tpl = TEMPLATES.find(t => t.key === selected);
    onSelect(tpl || null);
  };

  const selectedLabel = selected === 'blank'
    ? 'Start blank'
    : selected
      ? `Start with ${TEMPLATES.find(t => t.key === selected)?.label}`
      : 'Pick a starting point';

  const miniPreviews: Record<string, (sel: boolean) => JSX.Element> = {
    classic: (s) => <ClassicMini selected={s} />,
    'one-line': () => <OneLineMini />,
    bold: (s) => <BoldMini selected={s} />,
  };

  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      {/* Animated gradient backdrop */}
      <div className="animate-gradient-shift pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: 'linear-gradient(135deg, hsl(220 70% 95%), hsl(280 60% 95%), hsl(340 60% 95%), hsl(200 70% 95%))',
          backgroundSize: '400% 400%',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-14"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 15 }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Sparkles className="h-6 w-6 text-primary" />
          </motion.div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Choose a starting point
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Pick a look, then make it yours. Everything is editable later.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <TiltCard
              key={t.key}
              selected={selected === t.key}
              onClick={() => setSelected(t.key)}
              delay={0.15 + i * 0.08}
            >
              <div className="mb-3">
                {miniPreviews[t.key](selected === t.key)}
              </div>
              <p className="text-sm font-semibold text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </TiltCard>
          ))}

          {/* Blank */}
          <TiltCard
            selected={selected === 'blank'}
            onClick={() => setSelected('blank')}
            delay={0.15 + TEMPLATES.length * 0.08}
          >
            <div className="flex h-[82px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-muted/20">
              <Plus className={`h-7 w-7 transition-colors ${selected === 'blank' ? 'text-primary' : 'text-muted-foreground/30'}`} />
              <p className="mt-1 text-[10px] text-muted-foreground">Empty canvas</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Blank</p>
            <p className="text-xs text-muted-foreground">Build it from scratch</p>
          </TiltCard>
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-10 flex items-center justify-center gap-3 sm:mt-14"
        >
          {showCancel && onCancel && (
            <Button variant="outline" onClick={onCancel} size="lg">Cancel</Button>
          )}
          <Button
            onClick={handleUse}
            disabled={!selected || loading}
            size="lg"
            className="gap-2 px-8 text-base shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : null}
            {selectedLabel}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
