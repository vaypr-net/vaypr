import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useClients } from "@/hooks/api/useClients";
import { Building2, User, Users, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ClientSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onClientSelect?: (client: any) => void;
  label?: string;
}

export function ClientSelector({ value, onChange, onClientSelect, label = "Customer Name" }: ClientSelectorProps) {
  const { data: clients = [], isLoading } = useClients();
  const [open, setOpen] = useState(false);

  const companies = clients.filter(c => c.clientType === 'company');
  const individuals = clients.filter(c => c.clientType === 'individual');

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c._id === clientId);
    if (client) {
      onChange(client.name);
      if (onClientSelect) {
        onClientSelect(client);
      }
    }
    setOpen(false);
  };

  // Find current selected client by name to show in the trigger
  const selectedClient = clients.find(c => c.name === value);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading clients...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background font-normal hover:bg-background hover:text-foreground active:bg-background focus:bg-background"
          >
            {selectedClient ? (
              <span className="flex items-center gap-2">
                {selectedClient.clientType === 'company' ? (
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <User className="w-4 h-4 shrink-0" />
                )}
                {selectedClient.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Select a client</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50" align="start">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  {clients.length === 0 ? "No clients found." : "No matching clients."}
                </div>
              </CommandEmpty>
              {companies.length > 0 && (
                <CommandGroup heading="Companies">
                  {companies.map((client) => (
                    <CommandItem
                      key={client._id}
                      value={client.name}
                      onSelect={() => handleClientSelect(client._id)}
                    >
                      <Building2 className="mr-2 h-4 w-4 text-primary shrink-0" />
                      {client.name}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedClient?._id === client._id ? "opacity-100" : "opacity-0"
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
                      onSelect={() => handleClientSelect(client._id)}
                    >
                      <User className="mr-2 h-4 w-4 shrink-0" />
                      {client.name}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedClient?._id === client._id ? "opacity-100" : "opacity-0"
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

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No clients yet.{" "}
          <Link to="/dashboard/clients" className="text-primary hover:underline">
            Go to Clients page
          </Link>{" "}
          to add clients.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Need to add a new client?{" "}
          <Link to="/dashboard/clients" className="text-primary hover:underline">
            Go to Clients page
          </Link>
        </p>
      )}
    </div>
  );
}
