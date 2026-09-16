import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@project/components/ui/tooltip';

/** Small ⓘ icon that shows a plain-English tooltip on hover. */
export default function InfoTip({ text, side }: { text: string; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground/50 transition-colors hover:text-primary focus:outline-none">
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side || 'top'} className="max-w-[240px] text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
