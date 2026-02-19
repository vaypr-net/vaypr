import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateDMY, toISODateOnly } from "@/lib/document-date";

interface DocumentDateInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DocumentDateInput({
  id,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  className,
}: DocumentDateInputProps) {
  const normalized = toISODateOnly(value);
  const selectedDate = normalized ? new Date(`${normalized}T00:00:00`) : undefined;
  const displayValue = formatDateDMY(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal",
            !displayValue && "text-muted-foreground",
            className,
          )}
        >
          <span>{displayValue || placeholder}</span>
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
