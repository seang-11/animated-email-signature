import { Input } from '@project/components/ui/input';

const DEFAULT_SWATCHES = [
  '#111111', '#3E6FE7', '#1a1a2e', '#b40407', '#2d6a4f',
  '#7c3aed', '#0ea5e9', '#ea580c', '#d97706', '#059669',
];

export default function ColorPicker({
  value,
  onChange,
  placeholder,
  swatches,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  swatches?: string[];
}) {
  const colors = swatches || DEFAULT_SWATCHES;
  const displayVal = value || '#000000';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {colors.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
            value === c ? 'scale-110 border-ring ring-2 ring-ring/30' : 'border-border'
          }`}
          style={{ background: c }}
        />
      ))}
      <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border transition-colors hover:border-primary/50">
        <input
          type="color"
          value={displayVal}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-[-4px] h-[calc(100%+8px)] w-[calc(100%+8px)] cursor-pointer opacity-0"
        />
        <div className="h-4 w-4 rounded-full" style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }} />
      </label>
      <Input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '#hex'}
        className="h-7 w-20 font-mono text-xs"
      />
    </div>
  );
}
