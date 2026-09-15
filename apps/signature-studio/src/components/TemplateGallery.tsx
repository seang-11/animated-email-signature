import { useState } from 'react';
import { Button } from '@project/components/ui/button';
import { FileText, Minus, AlignLeft, Image, AlignCenter, Plus } from 'lucide-react';

export type TemplateDesign = {
  key: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  overrides: Record<string, any>;
};

export const TEMPLATES: TemplateDesign[] = [
  {
    key: 'classic',
    label: 'The Classic',
    desc: 'Logo, divider, contact details',
    icon: FileText,
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
    },
  },
  {
    key: 'one-line',
    label: 'One Line',
    desc: 'Minimal, great for replies',
    icon: Minus,
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
    },
  },
  {
    key: 'accent-bar',
    label: 'Accent Bar',
    desc: 'Colored rule, strong hierarchy',
    icon: AlignLeft,
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
    },
  },
  {
    key: 'banner-forward',
    label: 'Banner Forward',
    desc: 'Leads with your artwork',
    icon: Image,
    overrides: {
      layout: 'Stacked',
      accentColor: '#1a1a2e',
      textColor: '#333333',
      headingFont: 'Georgia',
      bodyFont: 'Arial',
      logoSize: 72,
      baseTextSize: 14,
      bannerSize: 340,
      showDivider: false,
      roundSocialIcons: false,
    },
  },
  {
    key: 'centered',
    label: 'Centered',
    desc: 'Symmetrical and formal',
    icon: AlignCenter,
    overrides: {
      layout: 'Stacked',
      accentColor: '#7c3aed',
      textColor: '#444444',
      headingFont: 'Georgia',
      bodyFont: 'Georgia',
      logoSize: 80,
      baseTextSize: 14,
      bannerSize: 200,
      showDivider: true,
      roundSocialIcons: true,
    },
  },
];

interface TemplateGalleryProps {
  onSelect: (template: TemplateDesign | null) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export default function TemplateGallery({ onSelect, onCancel, showCancel }: TemplateGalleryProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleUse = () => {
    if (!selected) {
      // Start blank
      onSelect(null);
      return;
    }
    const tpl = TEMPLATES.find(t => t.key === selected);
    onSelect(tpl || null);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Choose a starting point</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a design, then make it yours. You can change everything later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {TEMPLATES.map(t => (
          <button
            key={t.key}
            onClick={() => setSelected(t.key)}
            className={`rounded-xl border-2 bg-card p-4 text-left transition-all duration-200 hover:shadow-md ${
              selected === t.key
                ? 'border-primary shadow-md ring-2 ring-primary/20'
                : 'border-border hover:border-primary/30'
            }`}
          >
            <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-muted/50">
              <t.icon className={`h-8 w-8 ${selected === t.key ? 'text-primary' : 'text-muted-foreground/40'}`} />
            </div>
            <p className="text-sm font-medium text-foreground">{t.label}</p>
            <p className="text-xs text-muted-foreground">{t.desc}</p>
          </button>
        ))}

        <button
          onClick={() => setSelected('blank')}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 p-4 transition-all duration-200 hover:shadow-md ${
            selected === 'blank'
              ? 'border-primary shadow-md ring-2 ring-primary/20'
              : 'border-border hover:border-primary/30'
          }`}
        >
          <Plus className={`mb-2 h-8 w-8 ${selected === 'blank' ? 'text-primary' : 'text-muted-foreground/40'}`} />
          <p className="text-sm font-medium text-foreground">Start blank</p>
          <p className="text-xs text-muted-foreground">Build from scratch</p>
        </button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        {showCancel && onCancel && (
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button onClick={handleUse} disabled={!selected} size="lg" className="px-8">
          {selected === 'blank' ? 'Start blank' : selected ? 'Use this template' : 'Select a template'}
        </Button>
      </div>
    </div>
  );
}
