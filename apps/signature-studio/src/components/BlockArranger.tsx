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
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import {
  type ZonesConfig,
  type ZoneId,
  type BlockId,
  ZONE_IDS,
  ZONE_LABELS,
  ALL_BLOCKS,
} from '../utils/zones';

const collision: CollisionDetection = args => {
  const p = pointerWithin(args);
  return p.length > 0 ? p : rectIntersection(args);
};

function BlockPill({ id }: { id: string }) {
  const b = ALL_BLOCKS.find(x => x.id === id);
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-primary bg-card px-2.5 py-1.5 text-xs font-medium shadow-lg">
      <GripVertical className="h-3 w-3 text-primary" />
      {b?.label || id}
    </div>
  );
}

function SortableBlock({ id }: { id: BlockId }) {
  const b = ALL_BLOCKS.find(x => x.id === id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm transition-colors hover:border-primary/40 active:cursor-grabbing"
    >
      <GripVertical className="h-3 w-3 text-muted-foreground/50" />
      {b?.label || id}
    </div>
  );
}

function Zone({ id, items }: { id: ZoneId; items: BlockId[] }) {
  const { setNodeRef, isOver: directOver } = useDroppable({ id });
  const { over, active } = useDndContext();
  const overHere = over != null && over.id !== active?.id && items.some(t => t === over.id);
  const isOver = directOver || overHere;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[56px] rounded-lg border-2 border-dashed p-2 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20'
      }`}
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {ZONE_LABELS[id]}
      </p>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {items.map(bid => (
            <SortableBlock key={bid} id={bid} />
          ))}
        </div>
      </SortableContext>
      {items.length === 0 && (
        <p className="py-1 text-center text-[10px] text-muted-foreground/40">Drop here</p>
      )}
    </div>
  );
}

export default function BlockArranger({
  zones,
  onChange,
}: {
  zones: ZonesConfig;
  onChange: (z: ZonesConfig) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragZones, setDragZones] = useState<ZonesConfig>(zones);
  const isDragging = activeId !== null;
  const current = isDragging ? dragZones : zones;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function findContainer(id: string, z: ZonesConfig): ZoneId | null {
    for (const zone of ZONE_IDS) {
      if (z[zone].includes(id as BlockId)) return zone;
    }
    if (ZONE_IDS.includes(id as ZoneId)) return id as ZoneId;
    return null;
  }

  function onDragStart(e: DragStartEvent) {
    setDragZones({ ...zones, left: [...zones.left], main: [...zones.main], bottom: [...zones.bottom] });
    setActiveId(e.active.id as string);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findContainer(active.id as string, dragZones);
    const to = findContainer(over.id as string, dragZones);
    if (!from || !to || from === to) return;

    setDragZones(prev => {
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
    if (!over) {
      setActiveId(null);
      return;
    }
    const from = findContainer(active.id as string, dragZones);
    const to = findContainer(over.id as string, dragZones);
    if (from && to && from === to && active.id !== over.id) {
      const items = [...dragZones[from]];
      const oi = items.indexOf(active.id as BlockId);
      const ni = items.indexOf(over.id as BlockId);
      if (oi >= 0 && ni >= 0) {
        const reordered = arrayMove(items, oi, ni);
        const result = { ...dragZones, [from]: reordered };
        setDragZones(result);
        onChange(result);
        setActiveId(null);
        return;
      }
    }
    onChange(dragZones);
    setActiveId(null);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-[1fr_2fr] gap-1.5">
        <Zone id="left" items={current.left} />
        <Zone id="main" items={current.main} />
      </div>
      <div className="mt-1.5">
        <Zone id="bottom" items={current.bottom} />
      </div>
      <DragOverlay>{activeId ? <BlockPill id={activeId} /> : null}</DragOverlay>
    </DndContext>
  );
}
