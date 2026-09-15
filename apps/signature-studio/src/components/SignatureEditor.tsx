import { useState, useEffect, useCallback } from 'react';
import { loadSignature, saveSignature, createSignature, deleteSignature as deleteSigApi, duplicateSignature } from 'zitejs/api';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';
import { Pen, Palette, Share2, Check, Undo2, Redo2, RotateCcw, CloudOff } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import ContentTab from './ContentTab';
import DesignTab from './DesignTab';
import ExportTab from './ExportTab';
import SignaturePreview from './SignaturePreview';
import SignatureSwitcher from './SignatureSwitcher';
import TemplateGallery, { type TemplateDesign } from './TemplateGallery';
import { useUndoRedo } from '../hooks/useUndoRedo';

export type SigData = Record<string, any>;

const LOGO_URL = 'https://images.fillout.com/orgid-446582/flowpublicid-account/widgetid-branding-kit-logo/w1e7UPFZKZX7KRzv6ZBmCz/logo-icon.png';

const tabs = [
  { key: 'content' as const, label: 'Content', icon: Pen },
  { key: 'design' as const, label: 'Design', icon: Palette },
  { key: 'export' as const, label: 'Export', icon: Share2 },
];

export default function SignatureEditor() {
  const [tab, setTab] = useState<'content' | 'design' | 'export'>('content');
  const [signatures, setSignatures] = useState<SigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);
  const [galleryMode, setGalleryMode] = useState<'first-run' | 'new'>('first-run');

  const { state: sig, updateField, updateFields, undo, redo, canUndo, canRedo, reset, markSaved, revert } = useUndoRedo(null);

  // Load signatures
  const load = useCallback(async (sigId?: string) => {
    try {
      const res: any = await loadSignature({ signatureId: sigId });
      if (res.firstRun) {
        setFirstRun(true);
        setShowGallery(true);
        setGalleryMode('first-run');
      } else {
        setSignatures(res.signatures);
        if (res.signature) reset(res.signature);
      }
    } catch {
      toast.error('Failed to load signature');
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => { load(); }, [load]);

  // Debounced auto-save
  const debouncedSave = useDebouncedCallback((data: SigData) => {
    if (!data.id) return;
    const { id, lastUpdated, owner, ...fields } = data;
    saveSignature({ id, fields }).then(() => {
      setJustSaved(true);
      markSaved();
      setTimeout(() => setJustSaved(false), 2000);
    }).catch(() => toast.error('Save failed'));
  }, 800);

  // Wrap updateField to also trigger save
  const handleUpdateField = useCallback((key: string, value: any) => {
    updateField(key, value);
    // We need to trigger save after the state updates
  }, [updateField]);

  // Watch for sig changes → trigger save
  useEffect(() => {
    if (sig && sig.id) {
      debouncedSave(sig);
    }
  }, [sig, debouncedSave]);

  // Signature switcher handlers
  const handleSwitch = (id: string) => {
    debouncedSave.flush();
    load(id);
  };

  const handleNew = () => {
    setGalleryMode('new');
    setShowGallery(true);
  };

  const handleTemplateSelect = async (template: TemplateDesign | null) => {
    try {
      const res: any = await createSignature({
        signatureName: template ? template.label : 'New Signature',
        template: template?.key || '',
        designOverrides: template?.overrides || {},
      });
      setShowGallery(false);
      setFirstRun(false);
      await load(res.signature.id);
      toast.success('Signature created');
    } catch {
      toast.error('Failed to create signature');
    }
  };

  const handleDuplicate = async () => {
    if (!sig?.id) return;
    try {
      const res: any = await duplicateSignature({ id: sig.id });
      await load(res.signature.id);
      toast.success('Signature duplicated');
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSigApi({ id });
      await load();
      toast.success('Signature deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  const handleRename = (id: string, name: string) => {
    saveSignature({ id, fields: { signatureName: name } }).then(() => {
      setSignatures(prev => prev.map(s => s.id === id ? { ...s, signatureName: name } : s));
      if (sig?.id === id) updateField('signatureName', name);
    });
  };

  const handleSetDefault = (id: string) => {
    saveSignature({ id, fields: { isDefault: true } }).then(() => {
      setSignatures(prev => prev.map(s => ({ ...s, isDefault: s.id === id })));
      if (sig?.id === id) updateField('isDefault', true);
      toast.success('Set as default');
    });
  };

  const handleRevert = () => {
    revert();
    setConfirmRevert(false);
    toast.success('Reverted to last saved version');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Template gallery (first-run or creating new)
  if (showGallery) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header justSaved={false} />
        <TemplateGallery
          onSelect={handleTemplateSelect}
          onCancel={galleryMode === 'new' ? () => setShowGallery(false) : undefined}
          showCancel={galleryMode === 'new'}
        />
      </div>
    );
  }

  if (!sig) return <div className="p-8 text-center text-muted-foreground">Could not load signature.</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Branded header */}
      <Header justSaved={justSaved}>
        <SignatureSwitcher
          signatures={signatures}
          activeId={sig.id}
          onSwitch={handleSwitch}
          onNew={handleNew}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onRename={handleRename}
          onSetDefault={handleSetDefault}
        />
      </Header>

      {/* Toolbar: tabs + undo/redo */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="inline-flex rounded-lg bg-muted p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  tab === t.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              className="gap-1.5 text-muted-foreground"
            >
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              className="gap-1.5 text-muted-foreground"
            >
              <Redo2 className="h-3.5 w-3.5" /> Redo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmRevert(true)}
              disabled={!canUndo}
              className="gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="transition-opacity duration-200">
            {tab === 'content' && <ContentTab sig={sig} updateField={handleUpdateField} />}
            {tab === 'design' && <DesignTab sig={sig} updateField={handleUpdateField} />}
            {tab === 'export' && <ExportTab sig={sig} />}
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Preview</p>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-muted-foreground">New Message</span>
              </div>
              <div className="space-y-1 border-b border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground/60">From:</span> {sig.fullName || 'You'} &lt;{sig.emailAddress || 'you@company.com'}&gt;</div>
                <div><span className="font-medium text-foreground/60">Subject:</span> <span className="italic text-muted-foreground/60">Your subject here</span></div>
              </div>
              <div className="bg-white px-5 py-4">
                <div className="mb-6 space-y-1.5 text-sm text-gray-400">
                  <div className="h-2.5 w-3/4 rounded bg-gray-100" />
                  <div className="h-2.5 w-1/2 rounded bg-gray-100" />
                  <div className="h-2.5 w-2/3 rounded bg-gray-100" />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <SignaturePreview sig={sig} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revert confirmation */}
      <AlertDialog open={confirmRevert} onOpenChange={setConfirmRevert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to last saved?</AlertDialogTitle>
            <AlertDialogDescription>
              This will undo all changes since the last auto-save. Your undo history will be preserved.
            </AlertDialogDescription>
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

/** Branded header bar */
function Header({ justSaved, children }: { justSaved: boolean; children?: React.ReactNode }) {
  return (
    <header className="bg-gradient-to-r from-secondary to-primary">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <img src={LOGO_URL} alt="Prospect Automations" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-semibold text-white">Signature Studio</h1>
            <p className="text-xs text-white/70">by Prospect Automations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {children}
          <div className={`flex items-center gap-1.5 text-xs transition-all duration-500 ${justSaved ? 'text-white' : 'text-white/40'}`}>
            {justSaved ? (
              <><Check className="h-3.5 w-3.5" /> Saved</>
            ) : (
              <><CloudOff className="h-3 w-3" /> Auto-saving</>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
