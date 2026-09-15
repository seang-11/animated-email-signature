import { useCallback, useEffect, useRef, useState } from 'react';
import type { SigData } from '../components/SignatureEditor';

const MAX_HISTORY = 80;

export function useUndoRedo(initial: SigData | null) {
  const [state, setState] = useState<SigData | null>(initial);
  const pastRef = useRef<SigData[]>([]);
  const futureRef = useRef<SigData[]>([]);
  const lastSavedRef = useRef<SigData | null>(initial);
  const skipRecordRef = useRef(false);

  // Set from server load — resets history
  const reset = useCallback((data: SigData) => {
    setState(data);
    pastRef.current = [];
    futureRef.current = [];
    lastSavedRef.current = data;
  }, []);

  // Mark current state as "last saved"
  const markSaved = useCallback(() => {
    lastSavedRef.current = state;
  }, [state]);

  // Update a field — records undo step
  const updateField = useCallback((key: string, value: any) => {
    setState(prev => {
      if (!prev) return prev;
      if (!skipRecordRef.current) {
        pastRef.current = [...pastRef.current.slice(-MAX_HISTORY), prev];
        futureRef.current = [];
      }
      skipRecordRef.current = false;
      return { ...prev, [key]: value };
    });
  }, []);

  // Bulk update — single undo step
  const updateFields = useCallback((fields: Record<string, any>) => {
    setState(prev => {
      if (!prev) return prev;
      pastRef.current = [...pastRef.current.slice(-MAX_HISTORY), prev];
      futureRef.current = [];
      return { ...prev, ...fields };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      const past = pastRef.current;
      if (past.length === 0 || !prev) return prev;
      const previous = past[past.length - 1];
      pastRef.current = past.slice(0, -1);
      futureRef.current = [...futureRef.current, prev];
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      const future = futureRef.current;
      if (future.length === 0 || !prev) return prev;
      const next = future[future.length - 1];
      futureRef.current = future.slice(0, -1);
      pastRef.current = [...pastRef.current, prev];
      return next;
    });
  }, []);

  const revert = useCallback(() => {
    if (lastSavedRef.current && state) {
      pastRef.current = [...pastRef.current.slice(-MAX_HISTORY), state];
      futureRef.current = [];
      setState(lastSavedRef.current);
    }
  }, [state]);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if (mod && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return { state, setState, updateField, updateFields, undo, redo, revert, canUndo, canRedo, reset, markSaved };
}
