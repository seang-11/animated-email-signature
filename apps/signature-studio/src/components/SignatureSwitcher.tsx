import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Copy, Star, Trash2, MoreVertical, Pencil } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import { Input } from '@project/components/ui/input';
import type { SigData } from './SignatureEditor';

interface SwitcherProps {
  signatures: SigData[];
  activeId: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onSetDefault: (id: string) => void;
}

export default function SignatureSwitcher({
  signatures, activeId, onSwitch, onNew, onDuplicate, onDelete, onRename, onSetDefault,
}: SwitcherProps) {
  const [open, setOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = signatures.find(s => s.id === activeId);
  const activeName = active?.signatureName || 'Signature';

  const startRename = (id: string, name: string) => {
    setRenaming(id);
    setRenameVal(name);
    setMenuId(null);
  };

  const commitRename = () => {
    if (renaming && renameVal.trim()) {
      onRename(renaming, renameVal.trim());
    }
    setRenaming(null);
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => { setOpen(!open); setMenuId(null); }}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          <span className="max-w-[160px] truncate">{activeName}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-1.5 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your signatures
            </p>

            {signatures.map(s => (
              <div key={s.id} className="relative">
                {renaming === s.id ? (
                  <div className="flex items-center gap-1.5 px-3 py-2">
                    <Input
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }}
                      autoFocus
                      className="h-8 flex-1 text-sm"
                    />
                    <button
                      onClick={commitRename}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                      s.id === activeId ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => { onSwitch(s.id); setOpen(false); }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Check className={`h-4 w-4 ${s.id === activeId ? 'text-primary' : 'text-transparent'}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.signatureName || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.isDefault && <span className="text-primary">Default · </span>}
                          {s.lastUpdated ? `Updated ${new Date(s.lastUpdated).toLocaleDateString()}` : 'New'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuId(menuId === s.id ? null : s.id); }}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {menuId === s.id && (
                  <div className="absolute right-2 top-full z-10 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg">
                    <button onClick={() => startRename(s.id, s.signatureName || '')} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5" /> Rename
                    </button>
                    {!s.isDefault && (
                      <button onClick={() => { onSetDefault(s.id); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                        <Star className="h-3.5 w-3.5" /> Set as default
                      </button>
                    )}
                    {signatures.length > 1 && (
                      <button onClick={() => { setDeleting(s.id); setMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="mt-2 border-t border-border pt-2">
              <button onClick={() => { onNew(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                <Plus className="h-4 w-4 text-muted-foreground" /> New signature
              </button>
              <button onClick={() => { onDuplicate(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                <Copy className="h-4 w-4 text-muted-foreground" /> Duplicate current
              </button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleting} onOpenChange={v => { if (!v) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete signature?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{signatures.find(s => s.id === deleting)?.signatureName}". This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleting) { onDelete(deleting); setDeleting(null); setOpen(false); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
