import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useClients } from "@/hooks/useData";
import { Building2, User, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface ClientSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ClientSelector({ value, onChange, label = "Customer Name" }: ClientSelectorProps) {
  const { clients } = useClients();

  const companies = clients.filter(c => c.type === 'company');
  const individuals = clients.filter(c => c.type === 'individual');

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      onChange(client.name);
    }
  };

  // Find current selected client by name to show in the trigger
  const selectedClient = clients.find(c => c.name === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={selectedClient?.id || ""} onValueChange={handleClientSelect}>
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Select a client" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {clients.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No clients found</p>
            </div>
          ) : (
            <>
              {companies.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Companies
                  </div>
                  {companies.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        {client.name}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
              {individuals.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 mt-2">
                    <User className="w-3 h-3" />
                    Individuals
                  </div>
                  {individuals.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-secondary-foreground" />
                        {client.name}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
            </>
          )}
        </SelectContent>
      </Select>
      
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
