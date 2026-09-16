import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDndContext,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { SigData } from './SignatureEditor';
import { getZones, ALL_BLOCKS, ZONE_IDS, type BlockId, type ZoneId, type ZonesConfig } from '../utils/zones';

/* ─── Social icon sources ─── */
const SOCIAL_ICONS: Record<string, { src: string; label: string }> = {
  linkedInUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', label: 'LinkedIn' },
  instagramUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174855.png', label: 'Instagram' },
  facebookUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174848.png', label: 'Facebook' },
  threadsUrl: { src: 'https://cdn-icons-png.flaticon.com/512/14079/14079772.png', label: 'Threads' },
  xUrl: { src: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png', label: 'X' },
  tikTokUrl: { src: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', label: 'TikTok' },
  youTubeUrl: { src: 'https://cdn-icons-png.flaticon.com/512/174/174883.png', label: 'YouTube' },
  substackUrl: { src: 'https://img.icons8.com/color/96/substack.png', label: 'Substack' },
};

type ContactLine = { icon: string; content: JSX.Element };

function contactIcon(name: string, hex: string, style: string) {
  if (style === 'dark_mode_safe') return `https://img.icons8.com/ios-filled/50/FFFFFF/${name}.png`;
  const iconStyle = style === 'outlined' ? 'ios' : 'ios-filled';
  return `https://img.icons8.com/${iconStyle}/50/${hex.replace('#', '')}/${name}.png`;
}
function webUrl(raw: string) { const v = raw.trim(); return /^https?:\/\//i.test(v) ? v : `https://${v}`; }
function webLabel(raw: string) { return raw.trim().replace(/^https?:\/\//i, '').replace(/\/$/, ''); }

function ContactRow({ icon, content, fontSize, showIcon, isDarkSafe, accent }: { icon: string; content: JSX.Element; fontSize: number; showIcon: boolean; isDarkSafe: boolean; accent: string }) {
  const iconPx = Math.round(fontSize * 0.95);
  const chipSize = iconPx + 8;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: showIcon ? 7 : 0, marginBottom: 3 }}>
      {showIcon && (isDarkSafe ? (
        <div style={{ width: chipSize, height: chipSize, borderRadius: '50%', backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: Math.round(fontSize * 0.15) }}>
          <img src={icon} alt="" width={iconPx} height={iconPx} style={{ display: 'block' }} />
        </div>
      ) : (
        <img src={icon} alt="" width={iconPx} height={iconPx} style={{ flexShrink: 0, marginTop: Math.round(fontSize * 0.25), display: 'block' }} />
      ))}
      <span style={{ fontSize, lineHeight: `${fontSize + 6}px`, marginTop: isDarkSafe && showIcon ? 2 : 0 }}>{content}</span>
    </div>
  );
}

function MaybeLink({ url, children }: { url?: string; children: React.ReactNode }) {
  if (!url) return <>{children}</>;
  return <a href={webUrl(url)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{children}</a>;
}

const SEPARATOR_MAP: Record<string, string> = { pipe: '|', bullet: '·', dash: '—' };
const LOGO_RADIUS: Record<string, string> = { square: '0', rounded: '8px', circle: '50%' };
/* Blocks the accent bar runs alongside — one continuous bar, never one per block */
const BAR_BLOCKS = new Set<BlockId>(['name', 'company', 'tagline']);

const collision: CollisionDetection = args => {
  const p = pointerWithin(args);
  return p.length > 0 ? p : rectIntersection(args);
};

/* ─── Clickable block wrapper (read-only preview) ─── */
function BlockWrap({ id, active, onClick, children }: { id: BlockId; active: boolean; onClick?: (id: BlockId) => void; children: React.ReactNode }) {
  if (!onClick) return <>{children}</>;
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(id); }}
      className="cursor-pointer rounded transition-all duration-200"
      style={{
        outline: active ? '2px solid rgba(62,111,231,0.5)' : 'none',
        outlineOffset: 3,
        borderRadius: 4,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Draggable + clickable block wrapper (arrange mode) ─── */
function DraggableBlock({ id, active, onClick, children }: { id: BlockId; active: boolean; onClick?: (id: BlockId) => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={e => { e.stopPropagation(); onClick?.(id); }}
      className="group/blk relative cursor-grab rounded transition-colors active:cursor-grabbing"
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        outline: active ? '2px solid rgba(62,111,231,0.5)' : 'none',
        outlineOffset: 3,
        borderRadius: 4,
        touchAction: 'none',
      }}
    >
      <span className="pointer-events-none absolute -left-5 top-1/2 hidden -translate-y-1/2 opacity-0 transition-opacity group-hover/blk:opacity-100 sm:block">
        <GripVertical className="h-4 w-4 text-primary/60" />
      </span>
      <span className="pointer-events-none absolute -inset-1 rounded opacity-0 ring-1 ring-primary/30 transition-opacity group-hover/blk:opacity-100" />
      {children}
    </div>
  );
}

function DragPill({ id }: { id: string }) {
  const b = ALL_BLOCKS.find(x => x.id === id);
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-primary bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg">
      <GripVertical className="h-3 w-3 text-primary" />
      {b?.label || id}
    </div>
  );
}

/* ─── Droppable zone container ─── */
function ZoneDrop({ id, items, style, className, children }: {
  id: ZoneId;
  items: BlockId[];
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver: directOver } = useDroppable({ id });
  const { over, active } = useDndContext();
  const overHere = !!active && over != null && over.id !== active.id && items.some(t => t === over.id);
  const highlight = !!active && (directOver || overHere);
  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        ...style,
        borderRadius: 6,
        outline: highlight ? '2px dashed rgba(62,111,231,0.6)' : 'none',
        outlineOffset: 4,
      }}
    >
      {children}
    </div>
  );
}

function EmptyZoneHint({ label }: { label: string }) {
  return (
    <div className="flex min-h-[44px] min-w-[80px] items-center justify-center rounded-md border border-dashed border-primary/30 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-primary/50">
      {label}
    </div>
  );
}

export default function SignaturePreview({ sig, activeBlock, onBlockClick, onZonesChange }: {
  sig: SigData;
  activeBlock?: string;
  onBlockClick?: (block: string) => void;
  onZonesChange?: (zones: ZonesConfig) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragZones, setDragZones] = useState<ZonesConfig | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const accent = sig.accentColor || '#111111';
  const textColor = sig.textColor || '#333333';
  const headingFont = sig.headingFont || 'Arial';
  const bodyFont = sig.bodyFont || 'Arial';
  const logoSize = sig.logoSize || 96;
  const fontSize = sig.baseTextSize || 14;
  const bannerSize = sig.bannerSize || 180;
  const logoUrl = sig.logo?.[0]?.url;
  const bannerUrl = sig.bannerImage?.[0]?.url;
  const showVerticalDivider = sig.showDivider !== false;
  const round = sig.roundSocialIcons !== false;
  const spacing = sig.blockSpacing ?? 8;

  const companySize = sig.companySize || 13;
  const companyColor = sig.companyColor || textColor;
  const companyBold = sig.companyBold ?? false;
  const companyItalic = sig.companyItalic ?? false;
  const companyUppercase = sig.companyUppercase ?? false;
  const companyLS = sig.companyLetterSpacing ?? 0;

  const socialIconSize = sig.socialIconSize || 24;
  const contactIconStyle = sig.contactIconStyle || 'filled';
  const showContactIcons = contactIconStyle !== 'none';
  const isDarkSafe = contactIconStyle === 'dark_mode_safe';
  const logoAlign = sig.logoAlignment || 'top';
  const contactLayout = sig.contactLayout || 'stacked';
  const showAccentBar = sig.showNameAccentBar !== false;
  const accentBarColor = sig.accentBarColor || accent;
  const accentBarThickness = sig.accentBarThickness ?? 3;

  const nameSize = sig.nameSize || fontSize + 4;
  const nameColor = sig.nameColor || accent;
  const nameBold = sig.nameBold !== false;
  const titleSize = sig.jobTitleSize || fontSize;
  const titleColor = sig.jobTitleColor || textColor;
  const titleItalic = sig.jobTitleItalic ?? false;
  const separator = sig.nameTitleSeparator || 'pipe';
  const logoShape = sig.logoShape || 'square';
  const logoLinkUrl = sig.logoLinkUrl || '';
  const dividerColor = sig.dividerColor || '#dddddd';
  const dividerThickness = sig.dividerThickness ?? 1;
  const bannerLinkUrl = sig.bannerLinkUrl || '';
  const showCta = !!(sig.ctaText && sig.ctaUrl);
  const ctaText = sig.ctaText || '';
  const ctaUrl = sig.ctaUrl || '';
  const ctaBg = sig.ctaBackgroundColor || accent;
  const ctaTextColor = sig.ctaTextColor || '#ffffff';

  const taglineSize = sig.taglineSize || fontSize - 2;
  const taglineColor = sig.taglineColor || accent;
  const taglineBold = sig.taglineBold ?? false;
  const taglineItalic = sig.taglineItalic ?? false;
  const taglineUppercase = sig.taglineUppercase !== false;
  const taglineLS = sig.taglineLetterSpacing ?? 1;

  const logoRadius = LOGO_RADIUS[logoShape] || '0';
  const logoAlignMap: Record<string, string> = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };

  const isActive = (id: BlockId) => activeBlock === id;
  const handleClick = onBlockClick as ((id: BlockId) => void) | undefined;
  const editable = !!onZonesChange;

  /* ─── Build block elements ─── */
  const socials = Object.entries(SOCIAL_ICONS).filter(([k]) => sig[k]).map(([k, v]) => ({ url: sig[k], ...v }));

  const contactLines: ContactLine[] = [];
  if (sig.emailAddress) contactLines.push({ icon: contactIcon('new-post', accent, contactIconStyle), content: <a href={`mailto:${sig.emailAddress}`} style={{ color: accent, textDecoration: 'none' }}>{sig.emailAddress}</a> });
  if (sig.phone) contactLines.push({ icon: contactIcon('phone', accent, contactIconStyle), content: <span style={{ color: textColor }}>{sig.phone}</span> });
  if (sig.website) contactLines.push({ icon: contactIcon('domain', accent, contactIconStyle), content: <a href={webUrl(sig.website)} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'none' }}>{webLabel(sig.website)}</a> });

  const contactBlock = contactLines.length > 0 ? (() => {
    if (contactLayout === 'two_column' && contactLines.length >= 2) {
      const mid = Math.ceil(contactLines.length / 2);
      return (
        <div style={{ display: 'flex', gap: 20 }}>
          <div>{contactLines.slice(0, mid).map((cl, i) => <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />)}</div>
          <div>{contactLines.slice(mid).map((cl, i) => <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />)}</div>
        </div>
      );
    }
    return <div>{contactLines.map((cl, i) => <ContactRow key={i} icon={cl.icon} content={cl.content} fontSize={fontSize} showIcon={showContactIcons} isDarkSafe={isDarkSafe} accent={accent} />)}</div>;
  })() : null;

  const titleEl = sig.jobTitle && (
    separator === 'new_line' ? (
      <div style={{ fontSize: titleSize, color: titleColor, fontWeight: 'normal', fontStyle: titleItalic ? 'italic' : 'normal', lineHeight: `${titleSize + 6}px` }}>{sig.jobTitle}</div>
    ) : (
      <><span style={{ color: dividerColor, fontWeight: 'normal', padding: '0 7px' }}>{SEPARATOR_MAP[separator] || '|'}</span><span style={{ color: titleColor, fontWeight: 'normal', fontSize: titleSize, fontStyle: titleItalic ? 'italic' : 'normal' }}>{sig.jobTitle}</span></>
    )
  );

  const nameLine = (
    <div style={{ fontFamily: `${headingFont}, sans-serif`, fontSize: nameSize, lineHeight: `${nameSize + 8}px`, color: nameColor }}>
      <span style={{ fontWeight: nameBold ? 'bold' : 'normal' }}>{sig.fullName}</span>
      {titleEl}
    </div>
  );

  const companyLine = sig.company ? (
    <p style={{ margin: '2px 0 0 0', fontSize: companySize, color: companyColor, fontWeight: companyBold ? 'bold' : 'normal', fontStyle: companyItalic ? 'italic' : 'normal', textTransform: companyUppercase ? 'uppercase' : 'none', letterSpacing: companyLS, lineHeight: `${companySize + 5}px` }}>{sig.company}</p>
  ) : null;

  const taglineLine = sig.tagline ? (
    <p style={{ margin: 0, fontSize: taglineSize, letterSpacing: taglineLS, color: taglineColor, textTransform: taglineUppercase ? 'uppercase' : 'none' as any, fontWeight: taglineBold ? 'bold' : 'normal', fontStyle: taglineItalic ? 'italic' : 'normal' }}>{sig.tagline}</p>
  ) : null;

  const logoImg = logoUrl ? <MaybeLink url={logoLinkUrl}><img src={logoUrl} width={logoSize} alt="Logo" style={{ display: 'block', height: 'auto', borderRadius: logoRadius }} /></MaybeLink> : null;
  const bannerImg = bannerUrl ? <MaybeLink url={bannerLinkUrl}><img src={bannerUrl} width={bannerSize} alt="Banner" style={{ display: 'block' }} /></MaybeLink> : null;

  const ctaButton = showCta ? (
    <a href={webUrl(ctaUrl)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: ctaBg, color: ctaTextColor, borderRadius: '6px', textDecoration: 'none', fontSize: fontSize - 1, fontWeight: 'bold', fontFamily: `${bodyFont}, sans-serif` }}>{ctaText}</a>
  ) : null;

  const socialRow = socials.length > 0 ? (
    <div style={{ display: 'flex', gap: 4 }}>
      {socials.map(s => <a key={s.label} href={s.url} target="_blank" rel="noreferrer"><img src={s.src} alt={s.label} width={socialIconSize} height={socialIconSize} style={{ borderRadius: round ? '50%' : 0 }} /></a>)}
    </div>
  ) : null;

  /* ─── Block map with wrappers ─── */
  const w = (id: BlockId, el: JSX.Element | null) => {
    if (!el) return null;
    if (editable) return <DraggableBlock key={id} id={id} active={isActive(id)} onClick={handleClick}>{el}</DraggableBlock>;
    return <BlockWrap key={id} id={id} active={isActive(id)} onClick={handleClick}>{el}</BlockWrap>;
  };

  const blockMap: Record<BlockId, JSX.Element | null> = {
    logo: w('logo', logoImg),
    name: w('name', nameLine),
    company: w('company', companyLine),
    tagline: w('tagline', taglineLine),
    contacts: w('contacts', contactBlock),
    socials: w('socials', socialRow),
    banner: w('banner', bannerImg),
    cta: w('cta', ctaButton),
  };

  /* ─── Compact layout ─── */
  if (sig.layout === 'Compact') {
    return (
      <div style={{ fontFamily: `${bodyFont}, sans-serif` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoImg && <BlockWrap id="logo" active={isActive('logo')} onClick={handleClick}>{logoImg}</BlockWrap>}
          {showVerticalDivider && <div style={{ width: dividerThickness, height: 40, background: dividerColor }} />}
          <BlockWrap id="name" active={isActive('name')} onClick={handleClick}>
            <div>
              <span style={{ fontFamily: `${headingFont}, sans-serif`, fontSize: nameSize, fontWeight: nameBold ? 'bold' : 'normal', color: nameColor }}>{sig.fullName}</span>
              {sig.jobTitle && <span style={{ fontSize: titleSize, color: titleColor, fontStyle: titleItalic ? 'italic' : 'normal' }}> {SEPARATOR_MAP[separator] || '|'} {sig.jobTitle}</span>}
              {sig.company && <span style={{ fontSize: fontSize - 2, color: companyColor }}> {SEPARATOR_MAP[separator] || '|'} {sig.company}</span>}
              {sig.emailAddress && <span style={{ fontSize: fontSize - 2 }}> | <a href={`mailto:${sig.emailAddress}`} style={{ color: accent, textDecoration: 'none' }}>{sig.emailAddress}</a></span>}
              {sig.phone && <span style={{ fontSize: fontSize - 2, color: textColor }}> | {sig.phone}</span>}
              {sig.website && <span style={{ fontSize: fontSize - 2 }}> | <a href={webUrl(sig.website)} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'none' }}>{webLabel(sig.website)}</a></span>}
            </div>
          </BlockWrap>
        </div>
      </div>
    );
  }

  /* ─── Zone-based rendering ─── */
  const zones = dragZones ?? getZones(sig);

  function findContainer(id: string, z: ZonesConfig): ZoneId | null {
    for (const zone of ZONE_IDS) if (z[zone].includes(id as BlockId)) return zone;
    if (ZONE_IDS.includes(id as ZoneId)) return id as ZoneId;
    return null;
  }

  function onDragStart(e: DragStartEvent) {
    const base = getZones(sig);
    setDragZones({ left: [...base.left], main: [...base.main], bottom: [...base.bottom] });
    setActiveId(e.active.id as string);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over || !dragZones) return;
    const from = findContainer(active.id as string, dragZones);
    const to = findContainer(over.id as string, dragZones);
    if (!from || !to || from === to) return;
    setDragZones(prev => {
      if (!prev) return prev;
      const src = [...prev[from]];
      const dst = [...prev[to]];
      const si = src.indexOf(active.id as BlockId);
      if (si < 0) return prev;
      src.splice(si, 1);
      const oi = dst.indexOf(over.id as BlockId);
      dst.splice(oi >= 0 ? oi : dst.length, 0, active.id as BlockId);
      return { ...prev, [from]: src, [to]: dst };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!dragZones) return;
    let result = dragZones;
    if (over) {
      const from = findContainer(active.id as string, dragZones);
      const to = findContainer(over.id as string, dragZones);
      if (from && to && from === to && active.id !== over.id) {
        const items = [...dragZones[from]];
        const oi = items.indexOf(active.id as BlockId);
        const ni = items.indexOf(over.id as BlockId);
        if (oi >= 0 && ni >= 0) result = { ...dragZones, [from]: arrayMove(items, oi, ni) };
      }
    }
    onZonesChange?.(result);
    setDragZones(null);
  }

  function onDragCancel() {
    setActiveId(null);
    setDragZones(null);
  }

  function renderZone(blocks: BlockId[]) {
    const items: { key: string; el: JSX.Element }[] = [];
    let i = 0;
    while (i < blocks.length) {
      if (showAccentBar && BAR_BLOCKS.has(blocks[i])) {
        const run: BlockId[] = [];
        while (i < blocks.length && BAR_BLOCKS.has(blocks[i])) {
          if (blockMap[blocks[i]]) run.push(blocks[i]);
          i++;
        }
        if (run.length > 0) {
          items.push({
            key: `bar-${run.join('-')}`,
            el: (
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
                <div style={{ width: accentBarThickness, background: accentBarColor, flexShrink: 0, borderRadius: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  {run.map(id => <div key={id}>{blockMap[id]}</div>)}
                </div>
              </div>
            ),
          });
        }
        continue;
      }
      const el = blockMap[blocks[i]];
      if (el) items.push({ key: blocks[i], el });
      i++;
    }
    if (items.length === 0) return null;
    const stack = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
        {items.map(({ key, el }) => <div key={key}>{el}</div>)}
      </div>
    );
    if (!editable) return stack;
    const visible = blocks.filter(b => blockMap[b]);
    return <SortableContext items={visible} strategy={verticalListSortingStrategy}>{stack}</SortableContext>;
  }

  const leftContent = renderZone(zones.left);
  const mainContent = renderZone(zones.main);
  const bottomContent = renderZone(zones.bottom);

  /* Empty zones only show a drop hint while something is being dragged, so the
     idle preview stays a true-to-life copy of the signature. */
  const dragging = activeId !== null;
  const showLeftColumn = !!leftContent || editable;
  const showDividerColumn = showVerticalDivider && !!leftContent;

  const zoneBox = (id: ZoneId, items: BlockId[], style: React.CSSProperties, children: React.ReactNode) =>
    editable
      ? <ZoneDrop id={id} items={items} style={style}>{children}</ZoneDrop>
      : <div style={style}>{children}</div>;

  const body = (
    <div style={{ fontFamily: `${bodyFont}, sans-serif`, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: logoAlignMap[logoAlign] || 'flex-start', gap: 0 }}>
        {showLeftColumn && zoneBox('left', zones.left, leftContent ? { paddingRight: 16, flexShrink: 0 } : { flexShrink: 0, paddingRight: dragging ? 16 : 0 }, leftContent || (dragging ? <EmptyZoneHint label="Left" /> : null))}
        {showDividerColumn && (
          <div style={{ width: dividerThickness, background: dividerColor, marginRight: 16, flexShrink: 0, alignSelf: 'stretch' }} />
        )}
        {zoneBox('main', zones.main, { flexGrow: 1, minWidth: 0 }, mainContent || (dragging ? <EmptyZoneHint label="Main" /> : null))}
      </div>
      {(bottomContent || editable) &&
        zoneBox('bottom', zones.bottom, { marginTop: bottomContent || dragging ? spacing : 0 }, bottomContent || (dragging ? <EmptyZoneHint label="Full width — drop here" /> : null))}
    </div>
  );

  if (!editable) return body;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {body}
      <DragOverlay>{activeId ? <DragPill id={activeId} /> : null}</DragOverlay>
    </DndContext>
  );
}
