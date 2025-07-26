import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import { useSelectedSchedules, SelectedSchedulesProvider } from "@/contexts/selected-schedules-context";

// Assuming this is your existing Schedule type
interface Schedule {
  id: number;
  // ... other schedule fields
}

function SchedulesTable({ schedules }: { schedules: Schedule[] }) {
  const { selectedSchedules, toggleSchedule, selectAll } = useSelectedSchedules();

  // Handle "select all" checkbox
  const handleSelectAll = () => {
    selectAll(schedules.map(schedule => schedule.id));
  };

  const allSelected = schedules.length > 0 && schedules.every(schedule => 
    selectedSchedules.has(schedule.id)
  );
  const someSelected = schedules.some(schedule => 
    selectedSchedules.has(schedule.id)
  ) && !allSelected;

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="w-[50px] p-2">
            <Checkbox 
              checked={allSelected}
              ref={(checkbox: any) => {
                if (checkbox) {
                  checkbox.indeterminate = someSelected;
                }
              }}
              onCheckedChange={handleSelectAll}
            />
          </th>
          {/* Your existing table headers */}
        </tr>
      </thead>
      <tbody>
        {schedules.map((schedule) => (
          <tr key={schedule.id}>
            <td className="p-2">
              <Checkbox 
                checked={selectedSchedules.has(schedule.id)}
                onCheckedChange={() => toggleSchedule(schedule.id)}
              />
            </td>
            {/* Your existing table cells */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function SchedulesPage() {
  return (
    <SelectedSchedulesProvider>
      {/* Your existing page content */}
      <SchedulesTable schedules={[]} />
    </SelectedSchedulesProvider>
  );
}