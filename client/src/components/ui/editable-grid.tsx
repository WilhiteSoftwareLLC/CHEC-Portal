import React, { useState, useCallback, useRef, useMemo } from "react";
import { ChevronUp, ChevronDown, Edit, Save, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/phoneUtils";

export interface GridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  editable?: boolean;
  width?: string;
  type?: "text" | "email" | "tel" | "number" | "checkbox" | "dropdown" | "date";
  sortKey?: string; // Optional different field to use for sorting
  options?: { value: any; label: string }[] | ((row: any) => { value: any; label: string }[]);
  onCheckboxChange?: (id: number, checked: boolean) => void;
  selectAllCheckbox?: {
    checked: boolean;
    indeterminate: boolean;
    onChange: (checked: boolean) => void;
  };
  filterable?: boolean; // Whether this column supports filtering
}

export interface EditableGridProps {
  data: any[];
  columns: GridColumn[];
  onRowUpdate: (id: number, updates: Record<string, any>) => Promise<void>;
  onRowDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  onSelectionFilter?: (columnKey: string, filterValue: any, filterType: 'equals' | 'contains' | 'range') => void;
  customRowAction?: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: (row: any) => void;
  };
  actionsPosition?: 'left' | 'right'; // New prop to control Actions column position
}

type SortDirection = "asc" | "desc" | null;

// Completely isolated TextEditor component with its own state
interface TextEditorProps {
  textEditor: { rowId: number; columnKey: string; x: number; y: number; initialValue: string } | null;
  onSave: (rowId: number, columnKey: string, value: string) => void;
  onCancel: () => void;
}

const TextEditor = React.memo(({ textEditor, onSave, onCancel }: TextEditorProps) => {
  const [localValue, setLocalValue] = useState("");
  
  // Update local value when textEditor changes (when opening for a new cell)
  React.useEffect(() => {
    if (textEditor) {
      setLocalValue(textEditor.initialValue);
    }
  }, [textEditor?.rowId, textEditor?.columnKey]);
  
  if (!textEditor) return null;
  
  const handleSave = () => {
    onSave(textEditor.rowId, textEditor.columnKey, localValue);
  };
  
  return (
    <div 
      className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 p-3"
      style={{ left: textEditor.x, top: textEditor.y, width: '300px', height: '200px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        className="w-full h-32 resize-none border-0 outline-0 bg-transparent text-sm overflow-auto"
        placeholder="Enter text..."
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          Save
        </Button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Ctrl+Enter to save, Esc to cancel
      </div>
    </div>
  );
});

// Helper function to get display value for a cell
const getDisplayValue = (value: any, column: GridColumn): string => {
  if (value === null || value === undefined) return '';
  
  if (column.type === 'tel') {
    return formatPhoneNumber(String(value));
  }
  
  return String(value);
};

// Helper function to get storage value for a cell
const getStorageValue = (value: string, column: GridColumn): any => {
  if (column.type === 'tel') {
    return normalizePhoneNumber(value);
  }
  
  return value;
};

export default function EditableGrid({
  data,
  columns,
  onRowUpdate,
  onRowDelete,
  isLoading = false,
  className,
  onSelectionFilter,
  customRowAction,
  actionsPosition = 'right'
}: EditableGridProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; columnKey: string } | null>(null);
  const [filterDialog, setFilterDialog] = useState<{ columnKey: string; column: GridColumn } | null>(null);
  const [textEditor, setTextEditor] = useState<{ rowId: number; columnKey: string; x: number; y: number; initialValue: string } | null>(null);

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
    
    // Find the column configuration to check for custom sortKey
    const column = columns.find(col => col.key === sortColumn);
    const sortField = column?.sortKey || sortColumn;
    
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    // For numeric values, compare numerically
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      if (sortDirection === "asc") {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    }
    
    // For string values, compare lexicographically
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
    const column = columns.find(col => col.key === columnKey);
    const displayValue = column ? getDisplayValue(currentValue, column) : String(currentValue || "");
    setEditValue(displayValue);
  };

  const startTextEdit = (rowId: number, columnKey: string, currentValue: any, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const column = columns.find(col => col.key === columnKey);
    const displayValue = column ? getDisplayValue(currentValue, column) : String(currentValue || "");
    setTextEditor({ 
      rowId, 
      columnKey, 
      x: rect.left, 
      y: rect.bottom + window.scrollY,
      initialValue: displayValue
    });
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setTextEditor(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    try {
      const column = columns.find(col => col.key === editingCell.columnKey);
      const storageValue = column ? getStorageValue(editValue, column) : editValue;
      await onRowUpdate(editingCell.rowId, { [editingCell.columnKey]: storageValue });
      setEditingCell(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const handleTextEditorSave = async (rowId: number, columnKey: string, value: string) => {
    try {
      const column = columns.find(col => col.key === columnKey);
      const storageValue = column ? getStorageValue(value, column) : value;
      await onRowUpdate(rowId, { [columnKey]: storageValue });
      setTextEditor(null);
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const handleTextEditorCancel = () => {
    setTextEditor(null);
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

  const handleContextMenu = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    const column = columns.find(col => col.key === columnKey);
    if (column?.filterable !== false && onSelectionFilter) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        columnKey
      });
    }
  };

  const handleFilterClick = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (column) {
      setFilterDialog({ columnKey, column });
      setContextMenu(null);
    }
  };

  const FilterDialog = () => {
    const [filterFrom, setFilterFrom] = useState<string>("");
    const [filterTo, setFilterTo] = useState<string>("");
    
    if (!filterDialog) return null;
    
    const { columnKey, column } = filterDialog;
    
    const handleApplyFilter = () => {
      if (onSelectionFilter && (filterFrom.trim() || filterTo.trim())) {
        onSelectionFilter(columnKey, { from: filterFrom.trim() || null, to: filterTo.trim() || null }, 'range');
      }
      setFilterDialog(null);
      setFilterFrom("");
      setFilterTo("");
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg min-w-[350px]">
          <h3 className="text-lg font-semibold mb-4">Filter by {column.label}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter From</label>
              <Input
                type={column.type === 'number' ? 'number' : 'text'}
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                placeholder={`Enter minimum ${column.label.toLowerCase()}...`}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Filter To</label>
              <Input
                type={column.type === 'number' ? 'number' : 'text'}
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                placeholder={`Enter maximum ${column.label.toLowerCase()}...`}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setFilterDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleApplyFilter} disabled={!filterFrom.trim() && !filterTo.trim()}>
              Apply Filter
            </Button>
          </div>
        </div>
      </div>
    );
  };

  
  const ContextMenu = () => {
    if (!contextMenu) return null;
    
    return (
      <div 
        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 py-1"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
          onClick={() => handleFilterClick(contextMenu.columnKey)}
        >
          <Filter className="h-4 w-4" />
          Filter selections by this column
        </button>
      </div>
    );
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      setContextMenu(null);
    };
    
    if (contextMenu) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [contextMenu]);

  // Close text editor when clicking outside (with timeout to avoid immediate closure)
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      setTextEditor(null);
    };
    
    if (textEditor) {
      // Add a small delay to prevent the opening click from immediately closing the editor
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleDocumentClick);
      }, 10);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleDocumentClick);
      };
    }
  }, [textEditor]);

  // Helper function to render Actions column header
  const renderActionsHeader = () => (
    (onRowDelete || customRowAction) && (
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 whitespace-nowrap border-b">
        Actions
      </th>
    )
  );

  // Helper function to render Actions column cell
  const renderActionsCell = (row: any) => (
    (onRowDelete || customRowAction) && (
      <td className="px-4 py-3 whitespace-nowrap w-20">
        <div className="flex gap-1">
          {customRowAction && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => customRowAction.onClick(row)}
              className="h-8 w-8 p-0"
              title={customRowAction.label}
            >
              <customRowAction.icon className="h-4 w-4" />
            </Button>
          )}
          {onRowDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRowDelete(row.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </td>
    )
  );

  return (
    <div className={cn("border rounded-lg", className)}>
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {actionsPosition === 'left' && renderActionsHeader()}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b",
                    column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                    column.width && `w-${column.width}`
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                  onContextMenu={(e) => handleContextMenu(e, column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.selectAllCheckbox && (
                      <Checkbox
                        checked={column.selectAllCheckbox.checked}
                        ref={(el) => {
                          if (el) {
                            (el as any).indeterminate = column.selectAllCheckbox?.indeterminate;
                          }
                        }}
                        onCheckedChange={(checked) => column.selectAllCheckbox?.onChange(Boolean(checked))}
                        className="ml-1"
                      />
                    )}
                    {column.sortable && <SortIcon column={column.key} />}
                  </div>
                </th>
              ))}
              {actionsPosition === 'right' && renderActionsHeader()}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + ((onRowDelete || customRowAction) ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + ((onRowDelete || customRowAction) ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {actionsPosition === 'left' && renderActionsCell(row)}
                  {columns.map((column) => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.columnKey === column.key;
                    const value = row[column.key];
                    
                    return (
                      <td 
                        key={column.key} 
                        className={cn(
                          "px-4 py-3 whitespace-nowrap",
                          column.width && `w-${column.width}`,
                          column.type === "text" && "max-w-0 overflow-hidden"
                        )}
                      >
                        {column.type === "checkbox" ? (
                          <div className="flex justify-center">
                            <Checkbox
                              checked={Boolean(value)}
                              onCheckedChange={async (checked) => {
                                try {
                                  if (column.onCheckboxChange) {
                                    // Use custom checkbox handler (for UI-only checkboxes)
                                    column.onCheckboxChange(row.id, Boolean(checked));
                                  } else {
                                    // Use default database update handler
                                    await onRowUpdate(row.id, { [column.key]: checked });
                                  }
                                } catch (error) {
                                  console.error("Failed to update checkbox:", error);
                                }
                              }}
                            />
                          </div>
                        ) : column.type === "date" ? (
                          isEditing ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="date"
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
                              onClick={() => column.editable && startEdit(row.id, column.key, value ? new Date(value).toISOString().split('T')[0] : '')}
                            >
                              {value ? new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC' }) : (column.editable ? <span className="text-gray-400 italic">Click to edit</span> : "—")}
                            </div>
                          )
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
                              column.editable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2 -my-1",
                              column.type === "text" && "truncate min-w-0"
                            )}
                            onClick={(e) => {
                              if (column.editable) {
                                if (column.type === "text") {
                                  startTextEdit(row.id, column.key, value, e);
                                } else {
                                  startEdit(row.id, column.key, value);
                                }
                              }
                            }}
                            title={column.type === "text" && value ? String(value) : undefined}
                          >
                            {getDisplayValue(value, column) || (column.editable ? <span className="text-gray-400 italic">Click to edit</span> : "—")}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {actionsPosition === 'right' && renderActionsCell(row)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ContextMenu />
      <FilterDialog />
      <TextEditor 
        textEditor={textEditor}
        onSave={handleTextEditorSave}
        onCancel={handleTextEditorCancel}
      />
    </div>
  );
}
