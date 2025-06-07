import { useState, useCallback } from "react";
import { ChevronUp, ChevronDown, Edit, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface GridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  editable?: boolean;
  width?: string;
  type?: "text" | "email" | "tel" | "number" | "checkbox" | "dropdown";
  options?: { value: any; label: string }[] | ((row: any) => { value: any; label: string }[]);
}

export interface EditableGridProps {
  data: any[];
  columns: GridColumn[];
  onRowUpdate: (id: number, updates: Record<string, any>) => Promise<void>;
  onRowDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

export default function EditableGrid({
  data,
  columns,
  onRowUpdate,
  onRowDelete,
  isLoading = false,
  className
}: EditableGridProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === "asc" ? "desc" : prev === "desc" ? null : "asc");
      if (sortDirection === "desc") {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  }, [sortColumn, sortDirection]);

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === "asc") {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    }
  });

  const startEdit = (rowId: number, columnKey: string, currentValue: any) => {
    setEditingCell({ rowId, columnKey });
    setEditValue(String(currentValue || ""));
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    try {
      await onRowUpdate(editingCell.rowId, { [editingCell.columnKey]: editValue });
      setEditingCell(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className={cn("border rounded-lg", className)}>
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b",
                    column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                    column.width && `w-${column.width}`
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && <SortIcon column={column.key} />}
                  </div>
                </th>
              ))}
              {onRowDelete && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 whitespace-nowrap border-b">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (onRowDelete ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onRowDelete ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {columns.map((column) => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.columnKey === column.key;
                    const value = row[column.key];
                    
                    return (
                      <td 
                        key={column.key} 
                        className={cn(
                          "px-4 py-3 whitespace-nowrap",
                          column.width && `w-${column.width}`
                        )}
                      >
                        {column.type === "checkbox" ? (
                          <div className="flex justify-center">
                            <Checkbox
                              checked={Boolean(value)}
                              onCheckedChange={async (checked) => {
                                try {
                                  await onRowUpdate(row.id, { [column.key]: checked });
                                } catch (error) {
                                  console.error("Failed to update checkbox:", error);
                                }
                              }}
                            />
                          </div>
                        ) : column.type === "dropdown" ? (
                          <Select
                            value={value === null || value === "" ? "NO_COURSE" : String(value)}
                            onValueChange={async (newValue) => {
                              try {
                                let parsedValue: any;
                                if (newValue === "NO_COURSE") {
                                  parsedValue = null;
                                } else {
                                  parsedValue = isNaN(Number(newValue)) ? newValue : Number(newValue);
                                }
                                await onRowUpdate(row.id, { [column.key]: parsedValue });
                              } catch (error) {
                                console.error("Failed to update dropdown:", error);
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select...">
                                {(() => {
                                  const options = typeof column.options === 'function' ? column.options(row) : (column.options || []);
                                  return value === null || value === "" ? "No Course" : 
                                    options.find((opt: any) => String(opt.value) === String(value))?.label || "Select...";
                                })()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const options = typeof column.options === 'function' ? column.options(row) : (column.options || []);
                                return options.map((option: any) => (
                                  <SelectItem key={String(option.value)} value={String(option.value)}>
                                    {option.label}
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        ) : isEditing ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type={column.type || "text"}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={saveEdit}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className={cn(
                              "text-sm text-gray-900 dark:text-gray-100",
                              column.editable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2 -my-1"
                            )}
                            onClick={() => column.editable && startEdit(row.id, column.key, value)}
                          >
                            {value || (column.editable ? <span className="text-gray-400 italic">Click to edit</span> : "—")}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {onRowDelete && (
                    <td className="px-4 py-3 whitespace-nowrap w-20">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRowDelete(row.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}