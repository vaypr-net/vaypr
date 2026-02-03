import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BillTo } from "@/types/invoice";
import { ClientSelector } from "./ClientSelector";

interface BillToSectionProps {
  billTo: BillTo;
  onChange: (billTo: BillTo) => void;
}

export function BillToSection({ billTo, onChange }: BillToSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleChange = (field: keyof BillTo, value: string) => {
    onChange({ ...billTo, [field]: value });
  };

  const handleClientSelect = (client: any) => {
    // Auto-populate client details when a client is selected
    onChange({
      name: client.name,
      phone: client.phone || "",
      area: client.address || "", // Map address to area
      block: "",
      street: "",
      house: "",
      other: "",
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-lg font-semibold text-foreground">Bill To</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-4 animate-fade-in">
          <ClientSelector
            value={billTo.name}
            onChange={(name) => handleChange("name", name)}
            onClientSelect={handleClientSelect}
            label="Customer Name"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="billToPhone">Phone</Label>
            <Input
              id="billToPhone"
              placeholder="Phone number"
              value={billTo.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToArea">Area</Label>
            <Input
              id="billToArea"
              placeholder="Area"
              value={billTo.area}
              onChange={(e) => handleChange("area", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToBlock">Block</Label>
            <Input
              id="billToBlock"
              placeholder="Block"
              value={billTo.block}
              onChange={(e) => handleChange("block", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToStreet">Street</Label>
            <Input
              id="billToStreet"
              placeholder="Street"
              value={billTo.street}
              onChange={(e) => handleChange("street", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToHouse">House</Label>
            <Input
              id="billToHouse"
              placeholder="House"
              value={billTo.house}
              onChange={(e) => handleChange("house", e.target.value)}
            />
          </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="billToOther">Other</Label>
              <Input
                id="billToOther"
                placeholder="Additional details (apartment, floor, office, etc.)"
                value={billTo.other}
                onChange={(e) => handleChange("other", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
