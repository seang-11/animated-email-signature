import { useState, useEffect, useCallback, useRef } from 'react';
import { loadSignature, saveSignature, createSignature, deleteSignature as deleteSigApi, duplicateSignature } from 'zitejs/api';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';
import { Pen, Share2, Undo2, Redo2, RotateCcw, Maximize2, X, Save, Loader2, GripVertical, HelpCircle, Plus } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@project/components/ui/dialog';
import EditTab from './EditTab';
import ExportTab from './ExportTab';
import SignaturePreview from './SignaturePreview';
import SignatureSwitcher from './SignatureSwitcher';
import TemplateGallery, { type TemplateDesign } from './TemplateGallery';
import GuidedTour, { useTour } from './GuidedTour';
import { useUndoRedo } from '../hooks/useUndoRedo';
import type { ZonesConfig } from '../utils/zones';
import { isDemoReadOnly, notifyDemo, toDemoSignature } from '../utils/demoMode';
import { Eye } from 'lucide-react';

export type SigData = Record<string, any>;

const LOGO_URL = 'https://images.fillout.com/orgid-446582/flowpublicid-account/widgetid-branding-kit-logo/w1e7UPFZKZX7KRzv6ZBmCz/logo-icon.png';

const tabs = [
  { key: 'edit' as const, label: 'Edit', icon: Pen },
  { key: 'export' as const, label: 'Export', icon: Share2 },
];

const WIDTH_PRESETS = [
  { label: 'Gmail Narrow', px: 500 },
  { label: 'Gmail Wide', px: 800 },
  { label: 'Full', px: 0 },
];

/* The database stores dropdown values using their display labels ("Dark Mode Safe",
   "Circle"), while the app works in lowercase keys. Normalize on load so saved
   choices survive a reload instead of silently falling back to defaults. */
const SELECT_FIELDS = ['contactIconStyle', 'contactLayout', 'logoAlignment', 'logoShape', 'nameTitleSeparator', 'socialPosition'];
function normalizeSig(record: SigData): SigData {
  const out = { ...record };
  for (const f of SELECT_FIELDS) {
    if (typeof out[f] === 'string' && out[f]) out[f] = out[f].trim().toLowerCase().replace(/\s+/g, '_');
  }
  return out;
}

export default function SignatureEditor() {
  const [tab, setTab] = useState<'edit' | 'export'>('edit');
  const [signatures, setSignatures] = useState<SigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveState>('saved');
  const demoRef = useRef(false);
  const enterDemo = useCallback((force = false) => {
    demoRef.current = true;
    setSaveStatus('demo');
    notifyDemo(force);
  }, []);
  const [showGallery, setShowGallery] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);
  const [galleryMode, setGalleryMode] = useState<'first-run' | 'new'>('first-run');
  const [activeBlock, setActiveBlock] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(0);
  const tour = useTour();

  const { state: sig, updateField, undo, redo, canUndo, canRedo, reset, markSaved, revert } = useUndoRedo(null);
  const sigRef = useRef<SigData | null>(null);
  sigRef.current = sig;

  const probedRef = useRef(false);
  const load = useCallback(async (sigId?: string) => {
    try {
      const res: any = await loadSignature({ signatureId: sigId });
      if (res.firstRun) { setShowGallery(true); setGalleryMode('first-run'); return; }
      // On first load, check if this is a read-only marketplace demo (a no-op write that the demo blocks)
      if (!probedRef.current && res.signature) {
        probedRef.current = true;
        try { await saveSignature({ id: res.signature.id, fields: { signatureName: res.signature.signatureName ?? '' } }); }
        catch (err) { if (isDemoReadOnly(err)) { demoRef.current = true; notifyDemo(); } }
      }
      let list: SigData[] = res.signatures;
      let active: SigData | null = res.signature;
      if (demoRef.current) {
        // Swap the publisher's real details for fictional sample people
        list = list.map((r, i) => toDemoSignature(r, i));
        active = active ? list.find(r => r.id === active!.id) ?? null : null;
      }
      setSignatures(list);
      if (active) { reset(normalizeSig(active)); setSaveStatus(demoRef.current ? 'demo' : 'saved'); }
    } catch { toast.error('Failed to load signature'); }
    finally { setLoading(false); }
  }, [reset]);

  useEffect(() => { load(); }, [load]);

  const doSave = useCallback(async (opts?: { silent?: boolean }) => {
    const data = sigRef.current;
    if (!data?.id) return;
    // In demo mode: skip autosaves entirely; a manual Save just re-shows the notice
    if (demoRef.current) { if (!opts?.silent) notifyDemo(true); setSaveStatus('demo'); return; }
    const { id, lastUpdated, owner, ...fields } = data;
    setSaveStatus('saving');
    try {
      await saveSignature({ id, fields });
      markSaved();
      setSaveStatus('saved');
      if (!opts?.silent) toast.success('Saved');
    } catch (err: any) {
      if (isDemoReadOnly(err)) { enterDemo(!opts?.silent); return; }
      setSaveStatus('error');
      toast.error(err?.message ? `Save failed: ${err.message}` : 'Save failed — try the Save button again.');
    }
  }, [markSaved, enterDemo]);

  const debouncedSave = useDebouncedCallback(() => { doSave({ silent: true }); }, 800);

  const handleUpdateField = useCallback((key: string, value: any) => {
    updateField(key, value);
    setSaveStatus(demoRef.current ? 'demo' : 'dirty');
  }, [updateField]);

  useEffect(() => { if (sig && sig.id) debouncedSave(); }, [sig, debouncedSave]);

  const saveNow = useCallback(() => { debouncedSave.cancel(); doSave(); }, [debouncedSave, doSave]);
  const flushSave = useCallback(async () => { debouncedSave.cancel(); await doSave({ silent: true }); }, [debouncedSave, doSave]);
  const handleZonesChange = useCallback((zones: ZonesConfig) => {
    handleUpdateField('layoutZones', JSON.stringify(zones));
  }, [handleUpdateField]);

  // Cmd/Ctrl + S saves immediately
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveNow(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveNow]);

  const handleSwitch = (id: string) => { debouncedSave.flush(); load(id); };
  const handleNew = () => { setGalleryMode('new'); setShowGallery(true); };
  const handleTemplateSelect = async (template: TemplateDesign | null) => {
    try {
      const res: any = await createSignature({ signatureName: template ? template.label : 'New Signature', template: template?.key || '', designOverrides: template?.overrides || {} });
      setShowGallery(false); await load(res.signature.id); toast.success('Signature created');
    } catch (err) {
      if (isDemoReadOnly(err)) { setShowGallery(false); enterDemo(true); return; }
      toast.error('Failed to create signature');
    }
  };
  const handleDuplicate = async () => { if (!sig?.id) return; try { const res: any = await duplicateSignature({ id: sig.id }); await load(res.signature.id); toast.success('Duplicated'); } catch (err) { if (isDemoReadOnly(err)) return enterDemo(true); toast.error('Failed to duplicate'); } };
  const handleDelete = async (id: string) => { try { await deleteSigApi({ id }); await load(); toast.success('Deleted'); } catch (err: any) { if (isDemoReadOnly(err)) return enterDemo(true); toast.error(err?.message || 'Failed to delete'); } };
  const handleRename = (id: string, name: string) => { saveSignature({ id, fields: { signatureName: name } }).then(() => { setSignatures(prev => prev.map(s => s.id === id ? { ...s, signatureName: name } : s)); if (sig?.id === id) updateField('signatureName', name); }).catch(err => { if (isDemoReadOnly(err)) enterDemo(true); else toast.error('Failed to rename'); }); };
  const handleSetDefault = (id: string) => { saveSignature({ id, fields: { isDefault: true } }).then(() => { setSignatures(prev => prev.map(s => ({ ...s, isDefault: s.id === id }))); if (sig?.id === id) updateField('isDefault', true); toast.success('Set as default'); }).catch(err => { if (isDemoReadOnly(err)) enterDemo(true); else toast.error('Failed to set default'); }); };
  const handleRevert = () => { revert(); setConfirmRevert(false); toast.success('Reverted'); };

  const handleBlockClick = (block: string) => {
    setActiveBlock(block);
    setTab('edit');
    // Scroll the accordion item into view
    setTimeout(() => {
      const el = document.querySelector(`[data-state="open"][data-block-accordion="${block}"]`) || document.getElementById(`accordion-${block}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (showGallery) return (
    <div className="min-h-screen bg-background">
      <Header status="saved" />
      <TemplateGallery onSelect={handleTemplateSelect} onCancel={galleryMode === 'new' ? () => setShowGallery(false) : undefined} showCancel={galleryMode === 'new'} />
    </div>
  );

  if (!sig) return <div className="p-8 text-center text-muted-foreground">Could not load signature.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header status={saveStatus} onHelp={tour.start}>
        <div className="flex min-w-0 items-center gap-1.5" data-tour="switcher">
          <span className="text-border">/</span>
          <SignatureSwitcher signatures={signatures} activeId={sig.id} onSwitch={handleSwitch} onNew={handleNew} onDuplicate={handleDuplicate} onDelete={handleDelete} onRename={handleRename} onSetDefault={handleSetDefault} />
          <Button variant="ghost" size="sm" onClick={handleNew} className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </Header>

      {/* Toolbar */}
      <div className="sticky top-12 z-20 border-b border-border bg-background/85 backdrop-blur-md" data-tour="toolbar">
        <div className="mx-auto flex h-11 max-w-[1400px] items-center justify-between gap-2 px-4 sm:px-6">
          <nav className="flex h-full items-center gap-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`relative flex h-full items-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors ${tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <t.icon className="h-3.5 w-3.5" />{t.label}
                {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1" data-tour="undo">
            <SaveStatus status={saveStatus} />
            <div className="mx-2 hidden h-4 w-px bg-border sm:block" />
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="h-7 w-7 text-muted-foreground"><Undo2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" className="h-7 w-7 text-muted-foreground"><Redo2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmRevert(true)} disabled={!canUndo} title="Revert to last saved" className="h-7 w-7 text-muted-foreground"><RotateCcw className="h-3.5 w-3.5" /></Button>
            <Button onClick={saveNow} disabled={saveStatus === 'saving'} size="sm" className="ml-1.5 h-7 gap-1.5 px-2.5 text-xs">
              {saveStatus === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save <span className="hidden rounded bg-primary-foreground/15 px-1 font-mono text-[10px] sm:inline">⌘S</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
          <div className="min-w-0">
            {tab === 'edit' && <EditTab sig={sig} updateField={handleUpdateField} activeBlock={activeBlock} onActiveBlockChange={setActiveBlock} />}
            {tab === 'export' && <ExportTab sig={sig} flushSave={flushSave} />}
          </div>

          {/* Preview panel */}
          <div className="min-w-0 lg:sticky lg:top-[7.5rem] lg:self-start" data-tour="preview">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                <p className="text-[13px] font-medium text-foreground">Live preview</p>
                <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><GripVertical className="h-3 w-3" /> Drag to rearrange · click to edit</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)} className="h-7 gap-1 px-2 text-xs text-muted-foreground">
                <Maximize2 className="h-3.5 w-3.5" /> Expand
              </Button>
            </div>
            <div className="surface overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-border" /><div className="h-2.5 w-2.5 rounded-full bg-border" /><div className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="ml-3 text-xs font-medium text-muted-foreground">New message</span>
              </div>
              <div className="divide-y divide-border border-b border-border text-xs">
                <div className="flex gap-3 px-5 py-2"><span className="w-12 text-muted-foreground">From</span><span className="truncate text-foreground">{sig.fullName || 'You'} <span className="text-muted-foreground">&lt;{sig.emailAddress || 'you@company.com'}&gt;</span></span></div>
                <div className="flex gap-3 px-5 py-2"><span className="w-12 text-muted-foreground">Subject</span><span className="text-muted-foreground/70">Quick follow-up</span></div>
              </div>
              <div className="overflow-x-auto bg-white px-5 py-5">
                <div className="mb-6 space-y-2">
                  <div className="h-2 w-3/4 rounded-full bg-gray-100" /><div className="h-2 w-1/2 rounded-full bg-gray-100" /><div className="h-2 w-2/3 rounded-full bg-gray-100" />
                </div>
                <div className="pt-2">
                  <SignaturePreview sig={sig} activeBlock={activeBlock} onBlockClick={handleBlockClick} onZonesChange={handleZonesChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Preview overlay */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[900px] p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Preview</p>
              <div className="ml-3 inline-flex rounded-lg bg-muted p-0.5">
                {WIDTH_PRESETS.map(wp => (
                  <button key={wp.label} onClick={() => setPreviewWidth(wp.px)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${previewWidth === wp.px ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    {wp.label}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)} className="h-7 w-7"><X className="h-4 w-4" /></Button>
          </div>
          <div className="overflow-auto bg-white p-6" style={{ maxHeight: '70vh' }}>
            <div className="mx-auto" style={previewWidth ? { maxWidth: previewWidth } : undefined}>
              <SignaturePreview sig={sig} activeBlock={activeBlock} onBlockClick={handleBlockClick} onZonesChange={handleZonesChange} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revert confirmation */}
      <AlertDialog open={confirmRevert} onOpenChange={setConfirmRevert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to last saved?</AlertDialogTitle>
            <AlertDialogDescription>This will undo all changes since the last auto-save.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert}>Revert</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GuidedTour active={tour.active} step={tour.step} setStep={tour.setStep} dismiss={tour.dismiss} total={tour.total} />
    </div>
  );
}

type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'demo';

const STATUS_TEXT: Record<SaveState, string> = {
  saved: 'All changes saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Save failed — click Save to retry',
  demo: 'Demo mode — changes not saved',
};

function SaveStatus({ status }: { status: SaveState }) {
  const dot = status === 'error' ? 'bg-destructive' : status === 'dirty' ? 'bg-amber-500' : status === 'demo' ? 'bg-sky-500' : status === 'saving' ? 'bg-primary animate-pulse' : 'bg-emerald-500';
  return (
    <span className={`hidden items-center gap-1.5 text-xs sm:inline-flex ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {STATUS_TEXT[status]}
    </span>
  );
}

function Header({ status, onHelp, children }: { status: SaveState; onHelp?: () => void; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
            <img src={LOGO_URL} alt="Prospect Automations" className="h-4 w-4 object-contain" />
          </div>
          <span className="hidden whitespace-nowrap text-[13px] font-semibold tracking-tight text-foreground sm:inline">Signature Studio</span>
          {children}
        </div>
        <div className="flex items-center gap-1">
          {status === 'demo' && (
            <span className="hidden items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
              <Eye className="h-3 w-3" /> Demo
            </span>
          )}
          {onHelp && (
            <Button variant="ghost" size="sm" onClick={onHelp} className="h-7 gap-1.5 px-2 text-xs text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Tour</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
