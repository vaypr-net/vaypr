import { RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface LogoSizeControlProps {
  value: number;
  onChange: (value: number) => void;
}

export function LogoSizeControl({ value, onChange }: LogoSizeControlProps) {
  const handleReset = () => {
    onChange(1.0);
  };

  return (
    <div className="relative inline-flex items-center gap-3 px-4 py-3 rounded-[22px] backdrop-blur-xl bg-card/70 border border-border/50 shadow-lg">
      {/* Frosted glass overlay */}
      <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Label */}
      <span className="relative text-xs font-medium text-primary whitespace-nowrap">
        Logo Size
      </span>
      
      {/* Small Logo Icon */}
      <div className="relative flex items-center justify-center w-4 h-4 rounded bg-muted/60">
        <div className="w-2 h-2 rounded-sm bg-primary/60" />
      </div>
      
      {/* Slider */}
      <div className="relative w-28">
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange(vals[0])}
          min={0.5}
          max={2.0}
          step={0.1}
          className="cursor-pointer"
        />
      </div>
      
      {/* Large Logo Icon */}
      <div className="relative flex items-center justify-center w-5 h-5 rounded bg-muted/60">
        <div className="w-3 h-3 rounded-sm bg-primary" />
      </div>
      
      {/* Value Display */}
      <span className="relative text-xs font-medium text-muted-foreground w-8 text-center tabular-nums">
        {value.toFixed(1)}x
      </span>
      
      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="relative flex items-center justify-center w-6 h-6 rounded-full bg-muted/60 hover:bg-muted transition-colors"
        title="Reset to 1.0x"
      >
        <RotateCcw className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}
