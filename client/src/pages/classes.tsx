import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PrinterCheck, Plus } from "lucide-react";
import EditableGrid, { type GridColumn } from "@/components/ui/editable-grid";
import AddClassDialog from "@/components/dialogs/add-class-dialog";
import PageHeader from "@/components/layout/page-header";
import { useDialogs } from "@/contexts/dialog-context";
import { getCurrentGradeString, getCurrentGradeCode } from "@/lib/gradeUtils";
import type { Class, Grade, InsertClass } from "@shared/schema";

export default function Classes() {
  const { toast } = useToast();
  const { addClassOpen, setAddClassOpen } = useDialogs();

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const response = await fetch("/api/classes", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
    queryFn: async () => {
      const response = await fetch("/api/grades", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await fetch("/api/students", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Record<string, any> }) => {
      return await apiRequest(`/api/classes/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Class Updated",
        description: "Class has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: number) => {
      await apiRequest(`/api/classes/${classId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Class Deleted",
        description: "Class has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateClass = async (id: number, updates: Record<string, any>) => {
    const processedUpdates = { ...updates };
    
    // Convert grade codes to integers
    if (updates.startCode !== undefined) {
      processedUpdates.startCode = parseInt(updates.startCode);
    }
    if (updates.endCode !== undefined) {
      processedUpdates.endCode = parseInt(updates.endCode);
    }
    
    await updateClassMutation.mutateAsync({ id, updates: processedUpdates });
  };

  const handleDeleteClass = async (classId: number) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await deleteClassMutation.mutateAsync(classId);
    }
  };

  // Create grade options for dropdown
  const gradeOptions = Array.isArray(grades) ? grades.map((grade: Grade) => ({
    value: grade.code,
    label: grade.gradeName
  })) : [];

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as XXX-XXX-XXXX if we have 10 digits
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return phone; // Return original if not 10 digits
  };


  const handlePrintClassRosters = () => {
    if (!classes || !students || !settings || !grades) return;
    
    // Generate roster HTML for elementary classes
    const rosterHTML = generateClassRostersHTML();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(rosterHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateClassRostersHTML = () => {
    // Include all classes regardless of grade level
    const allClasses = (classes || []);
    
    // Sort classes by name
    const sortedClasses = allClasses.sort((a: any, b: any) => 
      Number(a.startCode) < Number(b.startCode)
    );
    
    const classRosters = sortedClasses.map((cls: any, index: number) => 
      generateSingleClassRosterHTML(cls, index > 0)
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Class Rosters</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .page-break { 
              page-break-before: always; 
            }
            .class-header {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 12px;
              text-align: left;
              white-space: nowrap;
              height: 28px;
              vertical-align: middle;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .number-column { width: 5%; text-align: center; }
            .grade-column { width: 8%; text-align: center; }
            .name-column { width: 15%; }
            .birth-column { width: 12%; text-align: center; }
            .parent-column { width: 15%; }
            .phone-column { width: 15%; white-space: nowrap; }
            .email-column { width: 30%; }
          </style>
        </head>
        <body>
          ${classRosters}
        </body>
      </html>
    `;
  };

  const generateSingleClassRosterHTML = (classData: any, addPageBreak: boolean = false) => {
    // Get students in this class (based on grade codes)
    const classStudents = (students || []).filter((student: any) => {
      const gradeCode = getCurrentGradeCode(student.gradYear, settings);
      return gradeCode !== null && gradeCode >= classData.startCode && gradeCode <= classData.endCode;
    });

    // Sort students by last name, then first name
    const sortedStudents = classStudents.sort((a: any, b: any) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });

    const rowsHTML = sortedStudents.map((student: any, index: number) => {
      const birthDate = student.birthdate ? new Date(student.birthdate).toLocaleDateString() : '';
      const gradeName = getCurrentGradeString(student.gradYear, settings, grades || []);
      const formattedPhone = formatPhoneNumber(student.family?.parentCell || '');
      
      return `
        <tr>
          <td class="number-column">${index + 1}.</td>
          <td class="grade-column">${gradeName}</td>
          <td class="name-column">${student.lastName}</td>
          <td class="name-column">${student.firstName}</td>
          <td class="birth-column">${birthDate}</td>
          <td class="parent-column">${student.family?.mother || ''}</td>
          <td class="parent-column">${student.family?.father || ''}</td>
          <td class="phone-column">${formattedPhone}</td>
          <td class="email-column">${student.family?.email || ''}</td>
        </tr>
      `;
    }).join('');

    return `
      ${addPageBreak ? '<div class="page-break"></div>' : ''}
      <div class="class-header">${classData.className} - Class Roster</div>
      <table>
        <thead>
          <tr>
            <th class="number-column"></th>
            <th class="grade-column">Grade</th>
            <th class="name-column">Last Name</th>
            <th class="name-column">First Name</th>
            <th class="birth-column">Birth Date</th>
            <th class="parent-column">Mother</th>
            <th class="parent-column">Father</th>
            <th class="phone-column">Parent's Cell</th>
            <th class="email-column">Email</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    `;
  };

  const columns: GridColumn[] = [
    { key: "className", label: "Class Name", sortable: true, editable: true, width: "50" },
    { key: "startCode", label: "Start Grade", sortable: true, editable: false, width: "25", type: "dropdown", options: gradeOptions },
    { key: "endCode", label: "End Grade", sortable: true, editable: false, width: "25", type: "dropdown", options: gradeOptions },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Classes"
        description="Manage grade-based class groupings"
        actionButton={{
          label: "Add Class",
          onClick: () => setAddClassOpen(true),
          icon: Plus
        }}
        secondaryButton={{
          label: "Print Class Rosters",
          onClick: handlePrintClassRosters,
          variant: "outline",
          icon: PrinterCheck
        }}
      />
      <div className="flex-1 p-6 overflow-hidden">
        <EditableGrid
          data={Array.isArray(classes) ? classes : []}
          columns={columns}
          onRowUpdate={handleUpdateClass}
          onRowDelete={handleDeleteClass}
          isLoading={classesLoading}
        />
        
        <AddClassDialog
          open={addClassOpen}
          onOpenChange={setAddClassOpen}
        />
      </div>
    </div>
  );
}
