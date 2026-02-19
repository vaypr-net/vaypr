import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InvoiceItem } from "@/types/invoice";

interface ItemDetailsProps {
  items: InvoiceItem[];
  currencySymbol: string;
  onItemsChange: (items: InvoiceItem[]) => void;
  hideQuantity?: boolean;
  hideUnitPrice?: boolean;
  hideTotalCost?: boolean;
  onHideQuantityChange?: (hide: boolean) => void;
  onHideUnitPriceChange?: (hide: boolean) => void;
  onHideTotalCostChange?: (hide: boolean) => void;
  tableHeaderColor?: string;
  onTableHeaderColorChange?: (color: string) => void;
}

export function ItemDetails({ 
  items, 
  currencySymbol, 
  onItemsChange,
  hideQuantity = false,
  hideUnitPrice = false,
  hideTotalCost = false,
  onHideQuantityChange,
  onHideUnitPriceChange,
  onHideTotalCostChange,
  tableHeaderColor = "#000000",
  onTableHeaderColorChange,
}: ItemDetailsProps) {
  const [headerColorInput, setHeaderColorInput] = useState(
    /^#[0-9A-F]{6}$/i.test(tableHeaderColor) ? tableHeaderColor : "#000000",
  );

  useEffect(() => {
    setHeaderColorInput(/^#[0-9A-F]{6}$/i.test(tableHeaderColor) ? tableHeaderColor : "#000000");
  }, [tableHeaderColor]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unitPrice: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    onItemsChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const getItemTotal = (item: InvoiceItem) => {
    const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    const price = typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) ? item.unitPrice : 0;
    return qty * price;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Item Details</h3>
        <Button onClick={addItem} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Display Options */}
      {onHideQuantityChange && onHideUnitPriceChange && onHideTotalCostChange && (
        <div className="flex flex-wrap gap-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Switch
              id="hideQuantity"
              checked={hideQuantity}
              onCheckedChange={onHideQuantityChange}
            />
            <Label htmlFor="hideQuantity" className="text-sm cursor-pointer">
              Hide Quantity
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="hideUnitPrice"
              checked={hideUnitPrice}
              onCheckedChange={onHideUnitPriceChange}
            />
            <Label htmlFor="hideUnitPrice" className="text-sm cursor-pointer">
              Hide Unit Price
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="hideTotalCost"
              checked={hideTotalCost}
              onCheckedChange={onHideTotalCostChange}
            />
            <Label htmlFor="hideTotalCost" className="text-sm cursor-pointer">
              Hide Total Cost
            </Label>
          </div>
          {onTableHeaderColorChange && (
            <div className="flex items-center gap-3">
              <Label htmlFor="tableHeaderColor" className="text-sm">
                Header Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="tableHeaderColor"
                  value={/^#[0-9A-F]{6}$/i.test(tableHeaderColor) ? tableHeaderColor : '#000000'}
                  onChange={(e) => {
                    const next = e.target.value;
                    setHeaderColorInput(next);
                    onTableHeaderColorChange(next);
                  }}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <Input
                  value={headerColorInput}
                  onChange={(e) => {
                    let value = e.target.value.trim();
                    if (value && !value.startsWith("#")) {
                      value = `#${value}`;
                    }

                    if (value === "" || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setHeaderColorInput(value);
                      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        onTableHeaderColorChange(value);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(headerColorInput)) {
                      onTableHeaderColorChange(headerColorInput);
                      return;
                    }

                    const fallback = /^#[0-9A-F]{6}$/i.test(tableHeaderColor) ? tableHeaderColor : "#000000";
                    setHeaderColorInput(fallback);
                    onTableHeaderColorChange(fallback);
                  }}
                  placeholder="#000000"
                  className="w-24 h-8 text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          No items added yet. Click "Add Item" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-3 items-end p-4 bg-secondary/30 rounded-lg animate-fade-in"
            >
              <div className={`col-span-12 ${!hideQuantity && !hideUnitPrice ? 'md:col-span-5' : hideQuantity && hideUnitPrice ? 'md:col-span-8' : 'md:col-span-6'} space-y-2`}>
                <Label htmlFor={`desc-${item.id}`}>Description</Label>
                <Input
                  id={`desc-${item.id}`}
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                />
              </div>
              {!hideQuantity && (
                <div className="col-span-4 md:col-span-2 space-y-2">
                  <Label htmlFor={`qty-${item.id}`}>Qty</Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
              {!hideUnitPrice && (
                <div className="col-span-4 md:col-span-2 space-y-2">
                  <Label htmlFor={`price-${item.id}`}>Unit Price</Label>
                  <Input
                    id={`price-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
              <div className="col-span-3 md:col-span-2 space-y-2">
                <Label>Total</Label>
                <div className="h-10 flex items-center px-3 bg-muted rounded-md font-medium text-foreground">
                  {currencySymbol} {getItemTotal(item).toFixed(2)}
                </div>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
