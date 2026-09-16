import { useState, useEffect, useCallback, useRef } from 'react';
import { loadSignature, saveSignature, createSignature, deleteSignature as deleteSigApi, duplicateSignature } from 'zitejs/api';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';
import { Pen, Share2, Check, Undo2, Redo2, RotateCcw, Maximize2, X, Save, Loader2, AlertCircle, GripVertical } from 'lucide-react';
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
import { useUndoRedo } from '../hooks/useUndoRedo';
import type { ZonesConfig } from '../utils/zones';

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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved');
  const [showGallery, setShowGallery] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);
  const [galleryMode, setGalleryMode] = useState<'first-run' | 'new'>('first-run');
  const [activeBlock, setActiveBlock] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(0);

  const { state: sig, updateField, updateFields, undo, redo, canUndo, canRedo, reset, markSaved, revert } = useUndoRedo(null);
  const sigRef = useRef<SigData | null>(null);
  sigRef.current = sig;

  const load = useCallback(async (sigId?: string) => {
    try {
      const res: any = await loadSignature({ signatureId: sigId });
      if (res.firstRun) { setFirstRun(true); setShowGallery(true); setGalleryMode('first-run'); }
      else { setSignatures(res.signatures); if (res.signature) { reset(normalizeSig(res.signature)); setSaveStatus('saved'); } }
    } catch { toast.error('Failed to load signature'); }
    finally { setLoading(false); }
  }, [reset]);

  useEffect(() => { load(); }, [load]);

  const doSave = useCallback(async (opts?: { silent?: boolean }) => {
    const data = sigRef.current;
    if (!data?.id) return;
    const { id, lastUpdated, owner, ...fields } = data;
    setSaveStatus('saving');
    try {
      await saveSignature({ id, fields });
      markSaved();
      setSaveStatus('saved');
      if (!opts?.silent) toast.success('Saved');
    } catch (err: any) {
      setSaveStatus('error');
      toast.error(err?.message ? `Save failed: ${err.message}` : 'Save failed — try the Save button again.');
    }
  }, [markSaved]);

  const debouncedSave = useDebouncedCallback(() => { doSave({ silent: true }); }, 800);

  const handleUpdateField = useCallback((key: string, value: any) => {
    updateField(key, value);
    setSaveStatus('dirty');
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
      setShowGallery(false); setFirstRun(false); await load(res.signature.id); toast.success('Signature created');
    } catch { toast.error('Failed to create signature'); }
  };
  const handleDuplicate = async () => { if (!sig?.id) return; try { const res: any = await duplicateSignature({ id: sig.id }); await load(res.signature.id); toast.success('Duplicated'); } catch { toast.error('Failed to duplicate'); } };
  const handleDelete = async (id: string) => { try { await deleteSigApi({ id }); await load(); toast.success('Deleted'); } catch (err: any) { toast.error(err?.message || 'Failed to delete'); } };
  const handleRename = (id: string, name: string) => { saveSignature({ id, fields: { signatureName: name } }).then(() => { setSignatures(prev => prev.map(s => s.id === id ? { ...s, signatureName: name } : s)); if (sig?.id === id) updateField('signatureName', name); }); };
  const handleSetDefault = (id: string) => { saveSignature({ id, fields: { isDefault: true } }).then(() => { setSignatures(prev => prev.map(s => ({ ...s, isDefault: s.id === id }))); if (sig?.id === id) updateField('isDefault', true); toast.success('Set as default'); }); };
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
    <div className="min-h-screen bg-muted/30">
      <Header status="saved" />
      <TemplateGallery onSelect={handleTemplateSelect} onCancel={galleryMode === 'new' ? () => setShowGallery(false) : undefined} showCancel={galleryMode === 'new'} />
    </div>
  );

  if (!sig) return <div className="p-8 text-center text-muted-foreground">Could not load signature.</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header status={saveStatus}>
        <SignatureSwitcher signatures={signatures} activeId={sig.id} onSwitch={handleSwitch} onNew={handleNew} onDuplicate={handleDuplicate} onDelete={handleDelete} onRename={handleRename} onSetDefault={handleSetDefault} />
      </Header>

      {/* Toolbar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="inline-flex rounded-lg bg-muted p-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all sm:gap-2 sm:px-4 ${tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                <t.icon className="h-4 w-4" /><span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8 text-muted-foreground sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3">
              <Undo2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Undo</span>
            </Button>
            <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8 text-muted-foreground sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3">
              <Redo2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Redo</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmRevert(true)} disabled={!canUndo} className="h-8 w-8 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={saveNow} disabled={saveStatus === 'saving'} className="ml-1 h-8 gap-1.5 px-3 sm:h-9">
              {saveStatus === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6">
          <SaveStatus status={saveStatus} />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            {tab === 'edit' && <EditTab sig={sig} updateField={handleUpdateField} activeBlock={activeBlock} onActiveBlockChange={setActiveBlock} />}
            {tab === 'export' && <ExportTab sig={sig} flushSave={flushSave} />}
          </div>

          {/* Preview panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Preview</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <GripVertical className="h-3 w-3" /> Drag any part to rearrange it — click to edit
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)} className="h-7 gap-1 text-xs text-muted-foreground">
                <Maximize2 className="h-3.5 w-3.5" /> Expand
              </Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
                <div className="h-3 w-3 rounded-full bg-red-400" /><div className="h-3 w-3 rounded-full bg-yellow-400" /><div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-muted-foreground">New Message</span>
              </div>
              <div className="space-y-1 border-b border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground/60">From:</span> {sig.fullName || 'You'} &lt;{sig.emailAddress || 'you@company.com'}&gt;</div>
                <div><span className="font-medium text-foreground/60">Subject:</span> <span className="italic text-muted-foreground/60">Your subject here</span></div>
              </div>
              <div className="overflow-x-auto bg-white px-5 py-4">
                <div className="mb-6 space-y-1.5 text-sm text-gray-400">
                  <div className="h-2.5 w-3/4 rounded bg-gray-100" /><div className="h-2.5 w-1/2 rounded bg-gray-100" /><div className="h-2.5 w-2/3 rounded bg-gray-100" />
                </div>
                <div className="border-t border-gray-100 pl-5 pt-4">
                  <SignaturePreview sig={sig} activeBlock={activeBlock} onBlockClick={handleBlockClick} onZonesChange={handleZonesChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

const STATUS_TEXT: Record<SaveState, string> = {
  saved: 'All changes saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Save failed — click Save to retry',
};

function SaveStatus({ status }: { status: SaveState }) {
  const Icon = status === 'saving' ? Loader2 : status === 'error' ? AlertCircle : status === 'dirty' ? Save : Check;
  const tone = status === 'error' ? 'text-destructive' : status === 'dirty' ? 'text-amber-600' : 'text-muted-foreground';
  return (
    <p className={`flex items-center gap-1.5 text-[11px] ${tone}`}>
      <Icon className={`h-3 w-3 ${status === 'saving' ? 'animate-spin' : ''}`} />
      {STATUS_TEXT[status]}
    </p>
  );
}

function Header({ status, children }: { status: SaveState; children?: React.ReactNode }) {
  const saved = status === 'saved';
  return (
    <header className="bg-gradient-to-r from-secondary to-primary">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm sm:h-12 sm:w-12">
              <img src={LOGO_URL} alt="Prospect Automations" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-semibold text-white sm:text-lg">Signature Studio</h1>
              <p className="hidden text-xs text-white/70 sm:block">by Prospect Automations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {children}
            <div className={`hidden items-center gap-1.5 text-xs sm:flex ${saved ? 'text-white/70' : 'text-white'}`}>
              {status === 'saving' ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                : status === 'error' ? <><AlertCircle className="h-3.5 w-3.5" /> Not saved</>
                : status === 'dirty' ? <><Save className="h-3.5 w-3.5" /> Unsaved</>
                : <><Check className="h-3.5 w-3.5" /> Saved</>}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
