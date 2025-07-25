import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, PrinterCheck, DollarSign, Eye } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import type { Family } from "@shared/schema";

export default function Invoices() {
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoicePaymentStatus, setInvoicePaymentStatus] = useState<Record<number, boolean>>({});
  
  const queryClient = useQueryClient();

  const { data: families } = useQuery({
    queryKey: ["/api/families"],
    retry: false,
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    retry: false,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    retry: false,
  });

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
    retry: false,
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
    retry: false,
  });

  const { data: hours } = useQuery({
    queryKey: ["/api/hours"],
    retry: false,
  });

  // Calculate computed invoices from families and students data
  const calculateFamilyInvoice = (family: Family, studentsData: any[], settingsData: any, gradesData: any[], coursesData: any[], hoursData: any[]) => {
    const familyFee = parseFloat(settingsData?.FamilyFee || "20");
    const backgroundFee = parseFloat(settingsData?.BackgroundFee || "0");
    const studentFee = parseFloat(settingsData?.StudentFee || "20");

    const familyStudents = studentsData.filter((s: any) => s.familyId === family.id);
    
    // Sort students by gradYear in reverse order (younger students first)
    const sortedStudents = familyStudents.sort((a: any, b: any) => {
      const gradYearA = parseInt(a.gradYear) || 0;
      const gradYearB = parseInt(b.gradYear) || 0;
      return gradYearB - gradYearA; // Higher gradYear = younger student
    });
    
    let total = familyFee + backgroundFee;
    total += familyStudents.length * studentFee;
    
    // Add course fees for each student (youngest first)
    sortedStudents.forEach((student: any) => {
      // Define hour order and corresponding student field names
      const hourMappings = [
        { hour: 0, field: 'mathHour' },
        { hour: 1, field: 'firstHour' },
        { hour: 2, field: 'secondHour' },
        { hour: 3, field: 'thirdHour' },
        { hour: 4, field: 'fourthHour' },
        { hour: 5, field: 'fifthHourFall' },
        { hour: 5, field: 'fifthHourSpring' },
      ];

      // Process courses in hour order
      hourMappings.forEach(mapping => {
        const courseName = student[mapping.field];
        if (courseName && courseName !== 'NO_COURSE') {
          // Find the actual course to get its fee
          const course = coursesData?.find((c: any) => c.courseName === courseName);
          if (course && course.fee && parseFloat(course.fee) > 0) {
            total += parseFloat(course.fee);
            
            // Add book rental fee if it exists
            if (course.bookRental && parseFloat(course.bookRental) > 0) {
              total += parseFloat(course.bookRental);
            }
          }
        }
      });
    });

    return {
      id: family.id,
      family,
      total,
      paid: invoicePaymentStatus[family.id] || false,
      students: sortedStudents
    };
  };

  const computedInvoices = Array.isArray(families) && Array.isArray(students) && settings && Array.isArray(grades) && Array.isArray(courses) && Array.isArray(hours)
    ? (families as Family[])
        .filter(family => family.active !== false) // Only show active families
        .map(family => calculateFamilyInvoice(family, students as any[], settings, grades as any[], courses as any[], hours as any[]))
    : [];

  const calculateTotalRevenue = () => {
    return computedInvoices.reduce((total: number, invoice: any) => {
      if (invoice.paid) {
        return total + invoice.total;
      }
      return total;
    }, 0);
  };

  const calculatePendingAmount = () => {
    return computedInvoices.reduce((total: number, invoice: any) => {
      if (!invoice.paid) {
        return total + invoice.total;
      }
      return total;
    }, 0);
  };

  const handlePrintAllInvoices = () => {
    if (!families || !students || !settings || !grades || !courses || !hours) return;
    
    // Cache data for invoice generation
    (window as any).cachedSettings = settings;
    (window as any).cachedStudents = students;
    (window as any).cachedGrades = grades;
    (window as any).cachedCourses = courses;
    (window as any).cachedHours = hours;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate invoice HTML for all families
    const invoiceHTML = generateAllInvoicesHTML();
    
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateAllInvoicesHTML = () => {
    if (!families) return '';

    const invoicePages = (families as Family[]).map((family, index) => 
      generateSingleInvoiceHTML(family, index > 0)
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CHEC Invoices</title>
          <style>
            @media print {
              .page-break { page-break-before: always; }
            }
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-header h1 { font-size: 24px; margin: 0; color: #333; }
            .family-name { font-size: 18px; margin: 20px 0; font-weight: bold; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .fee-column { text-align: right; }
            .total-row { border-top: 2px solid #333; font-weight: bold; }
            .total-row td { padding-top: 15px; }
          </style>
        </head>
        <body>
          ${invoicePages}
        </body>
      </html>
    `;
  };

  const generateSingleInvoiceHTML = (family: Family, addPageBreak: boolean = false) => {
    // Get settings for fees
    const familyFee = parseFloat((window as any).cachedSettings?.FamilyFee || "20");
    const backgroundFee = parseFloat((window as any).cachedSettings?.BackgroundFee || "0");
    const studentFee = parseFloat((window as any).cachedSettings?.StudentFee || "20");

    // Get students for this family and sort by gradYear (youngest first)
    const familyStudents = ((window as any).cachedStudents?.filter((s: any) => s.familyId === family.id) || [])
      .sort((a: any, b: any) => {
        const gradYearA = parseInt(a.gradYear) || 0;
        const gradYearB = parseInt(b.gradYear) || 0;
        return gradYearB - gradYearA; // Higher gradYear = younger student
      });

    const coursesData = (window as any).cachedCourses || [];
    
    let invoiceRows = [];
    let total = 0;

    // 1. Add family fee first
    invoiceRows.push({
      name: `${family.father || ''} & ${family.mother || ''}`.trim() || family.lastName,
      grade: '',
      hour: '',
      item: 'Family Fee',
      fee: familyFee
    });
    total += familyFee;

    // 2. Add background check fee second
    invoiceRows.push({
      name: `${family.father || ''} & ${family.mother || ''}`.trim() || family.lastName,
      grade: '',
      hour: '',
      item: 'Background Check',
      fee: backgroundFee
    });
    total += backgroundFee;

    // 3. Add student fees (youngest first)
    familyStudents.forEach((student: any) => {
      const currentGrade = getCurrentGradeForStudent(student);
      
      // Student fee
      invoiceRows.push({
        name: student.firstName,
        grade: currentGrade,
        hour: '',
        item: 'Student Fee',
        fee: studentFee
      });
      total += studentFee;
    });

    // 4. Add course fees for each student (youngest first), in hour order
    familyStudents.forEach((student: any) => {
      const currentGrade = getCurrentGradeForStudent(student);
      
      // Define hour order and corresponding student field names
      const hourMappings = [
        { hour: 0, field: 'mathHour', hourName: (window as any).cachedHours?.find((h: any) => h.id === 0)?.description || 'Math' },
        { hour: 1, field: 'firstHour', hourName: (window as any).cachedHours?.find((h: any) => h.id === 1)?.description || '1st' },
        { hour: 2, field: 'secondHour', hourName: (window as any).cachedHours?.find((h: any) => h.id === 2)?.description || '2nd' },
        { hour: 3, field: 'thirdHour', hourName: (window as any).cachedHours?.find((h: any) => h.id === 3)?.description || '3rd' },
        { hour: 4, field: 'fourthHour', hourName: (window as any).cachedHours?.find((h: any) => h.id === 4)?.description || '4th' },
        { hour: 5, field: 'fifthHourFall', hourName: ((window as any).cachedHours?.find((h: any) => h.id === 5)?.description || '5th') + ' Fall' },
        { hour: 5, field: 'fifthHourSpring', hourName: ((window as any).cachedHours?.find((h: any) => h.id === 5)?.description || '5th') + ' Spring' },
      ];

      // Process courses in hour order, only include those with fees
      hourMappings.forEach(mapping => {
        const courseName = student[mapping.field];
        if (courseName && courseName !== 'NO_COURSE') {
          // Find the actual course to get its fee
          const course = coursesData.find((c: any) => c.courseName === courseName);
          if (course && course.fee && parseFloat(course.fee) > 0) {
            const courseFee = parseFloat(course.fee);
            invoiceRows.push({
              name: student.firstName,
              grade: currentGrade,
              hour: mapping.hourName,
              item: courseName,
              fee: courseFee
            });
            total += courseFee;

            // Add book rental fee immediately after course fee if it exists
            if (course.bookRental && parseFloat(course.bookRental) > 0) {
              const bookRentalFee = parseFloat(course.bookRental);
              invoiceRows.push({
                name: student.firstName,
                grade: currentGrade,
                hour: mapping.hourName,
                item: `${courseName} - Book Rental`,
                fee: bookRentalFee
              });
              total += bookRentalFee;
            }
          }
        }
      });
    });

    const rowsHTML = invoiceRows.map(row => `
      <tr>
        <td>${row.name}</td>
        <td>${row.grade}</td>
        <td>${row.hour}</td>
        <td>${row.item}</td>
        <td class="fee-column">$${row.fee}</td>
      </tr>
    `).join('');

    return `
      ${addPageBreak ? '<div class="page-break"></div>' : ''}
      <div class="invoice-header">
        <h1>CHEC Fees</h1>
      </div>
      <div class="family-name">${family.lastName}, ${family.father || ''} & ${family.mother || ''}</div>
      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Grade</th>
            <th>Hour</th>
            <th>Item</th>
            <th class="fee-column">Fee</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
          <tr class="total-row">
            <td colspan="4"><strong>Total Fees Due</strong></td>
            <td class="fee-column"><strong>$${total}</strong></td>
          </tr>
        </tbody>
      </table>
    `;
  };

  const getCurrentGradeForStudent = (student: any) => {
    const settingsCache = (window as any).cachedSettings;
    const gradesCache = (window as any).cachedGrades;
    
    if (!settingsCache || !gradesCache || !student.gradYear) return "Unknown";
    
    const schoolYear = parseInt(settingsCache.SchoolYear || "2024");
    const gradeCode = schoolYear - parseInt(student.gradYear) + 13;
    const grade = gradesCache.find((g: any) => g.code === gradeCode);
    return grade ? grade.gradeName : "Unknown";
  };

  const togglePaymentStatus = (familyId: number) => {
    setInvoicePaymentStatus(prev => ({
      ...prev,
      [familyId]: !prev[familyId]
    }));
  };

  const handleViewInvoice = (family: Family) => {
    // Cache data for invoice generation
    (window as any).cachedSettings = settings;
    (window as any).cachedStudents = students;
    (window as any).cachedGrades = grades;
    (window as any).cachedCourses = courses;
    (window as any).cachedHours = hours;
    
    setSelectedFamily(family);
    setInvoiceDialogOpen(true);
  };

  return (
    <div>
      <PageHeader 
        title="Invoices"
        description="Automatically computed from family and student data"
        actionButton={{
          label: "Print All Invoices",
          onClick: handlePrintAllInvoices
        }}
      />
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600 h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${calculateTotalRevenue()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-orange-600 h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${calculatePendingAmount()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600 h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Invoices</p>
                <p className="text-lg font-semibold text-gray-900">
                  {computedInvoices.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Grid */}
      <div className="border rounded-lg">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b">Family Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {computedInvoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {invoice.family.lastName}, {invoice.family.father} & {invoice.family.mother}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${invoice.total}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={invoice.paid ? "default" : "destructive"}>
                      {invoice.paid ? "Paid" : "Unpaid"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewInvoice(invoice.family)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={invoice.paid ? "outline" : "default"}
                        size="sm"
                        onClick={() => togglePaymentStatus(invoice.family.id)}
                      >
                        {invoice.paid ? "Mark Unpaid" : "Mark Paid"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Invoice Preview - {selectedFamily?.lastName}
            </DialogTitle>
          </DialogHeader>
          {selectedFamily && (
            <div 
              className="border rounded-lg p-6 bg-white"
              dangerouslySetInnerHTML={{ 
                __html: generateSingleInvoiceHTML(selectedFamily, false) 
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
