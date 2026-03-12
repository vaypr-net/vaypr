import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Building2, User, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  _id: string;
  name: string;
  clientType?: string;
  [key: string]: any;
}

interface SearchableClientSelectProps {
  value: string; // selected clientId
  onValueChange: (clientId: string) => void;
  clients: Client[];
  placeholder?: string;
  className?: string;
}

export function SearchableClientSelect({
  value,
  onValueChange,
  clients,
  placeholder = "Select client",
  className,
}: SearchableClientSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedClient = clients.find((c) => c._id === value);

  const companies = clients.filter((c) => c.clientType === "company");
  const individuals = clients.filter((c) => c.clientType === "individual");
  const ungrouped = clients.filter(
    (c) => c.clientType !== "company" && c.clientType !== "individual"
  );

  const hasGroups = companies.length > 0 || individuals.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal hover:bg-background hover:text-foreground active:bg-background focus:bg-background", className)}
        >
          {selectedClient ? (
            <span className="flex items-center gap-2 truncate">
              {selectedClient.clientType === "company" ? (
                <Building2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <User className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{selectedClient.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50" align="start">
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No matching clients found.</CommandEmpty>

            {hasGroups ? (
              <>
                {companies.length > 0 && (
                  <CommandGroup heading="Companies">
                    {companies.map((client) => (
                      <CommandItem
                        key={client._id}
                        value={client.name}
                        onSelect={() => {
                          onValueChange(client._id);
                          setOpen(false);
                        }}
                      >
                        <Building2 className="mr-2 h-4 w-4 text-primary shrink-0" />
                        {client.name}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            value === client._id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {individuals.length > 0 && (
                  <CommandGroup heading="Individuals">
                    {individuals.map((client) => (
                      <CommandItem
                        key={client._id}
                        value={client.name}
                        onSelect={() => {
                          onValueChange(client._id);
                          setOpen(false);
                        }}
                      >
                        <User className="mr-2 h-4 w-4 shrink-0" />
                        {client.name}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            value === client._id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {ungrouped.length > 0 && (
                  <CommandGroup heading="Others">
                    {ungrouped.map((client) => (
                      <CommandItem
                        key={client._id}
                        value={client.name}
                        onSelect={() => {
                          onValueChange(client._id);
                          setOpen(false);
                        }}
                      >
                        <User className="mr-2 h-4 w-4 shrink-0" />
                        {client.name}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            value === client._id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client._id}
                    value={client.name}
                    onSelect={() => {
                      onValueChange(client._id);
                      setOpen(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4 shrink-0" />
                    {client.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === client._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
