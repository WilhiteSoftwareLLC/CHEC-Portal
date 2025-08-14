import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, PrinterCheck, DollarSign, Eye, Plus, Settings, Link2 } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import AddPaymentDialog from "@/components/dialogs/add-payment-dialog";
import AdjustBillDialog from "@/components/dialogs/adjust-bill-dialog";
import { generateFamilyHash } from "@/lib/invoice-utils";
import type { Family, Payment, BillAdjustment } from "@shared/schema";

export default function Invoices() {
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFamilyForPayment, setSelectedFamilyForPayment] = useState<Family | null>(null);
  const [adjustBillDialogOpen, setAdjustBillDialogOpen] = useState(false);
  const [selectedFamilyForAdjustment, setSelectedFamilyForAdjustment] = useState<Family | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateFamilyMutation = useMutation({
    mutationFn: async ({ id, family }: { id: number; family: Partial<Family> }) => {
      const response = await fetch(`/api/families/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(family),
      });
      if (!response.ok) throw new Error("Failed to update family");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
  });

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

  const { data: payments } = useQuery({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: billAdjustments } = useQuery({
    queryKey: ["/api/bill-adjustments"],
    retry: false,
  });

  // Calculate computed invoices from families and students data
  const calculateFamilyInvoice = (family: Family, studentsData: any[], settingsData: any, gradesData: any[], coursesData: any[], hoursData: any[], paymentsData: Payment[], adjustmentsData: BillAdjustment[]) => {
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
    
    let total = familyFee;
    // Only add background check fee if family needs it
    if (family.needsBackgroundCheck) {
      total += backgroundFee;
    }
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

    // Calculate total payments made by this family
    const familyPayments = paymentsData?.filter((payment: Payment) => payment.familyId === family.id) || [];
    const totalPaid = familyPayments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
    
    // Calculate total adjustments for this family
    const familyAdjustments = adjustmentsData?.filter((adjustment: BillAdjustment) => adjustment.familyId === family.id) || [];
    const totalAdjustments = familyAdjustments.reduce((sum, adjustment) => sum + parseFloat(adjustment.amount.toString()), 0);
    
    // Calculate adjusted total (includes adjustments in the base total)
    const adjustedTotal = total + totalAdjustments;
    const unpaidBalance = adjustedTotal - totalPaid;

    return {
      id: family.id,
      family,
      total: adjustedTotal, // Now includes adjustments
      totalAdjustments,
      adjustedTotal,
      totalPaid,
      unpaidBalance,
      payments: familyPayments,
      adjustments: familyAdjustments,
      students: sortedStudents
    };
  };

  const computedInvoices = Array.isArray(families) && Array.isArray(students) && settings && Array.isArray(grades) && Array.isArray(courses) && Array.isArray(hours) && Array.isArray(payments) && Array.isArray(billAdjustments)
    ? (families as Family[])
        .filter(family => family.active !== false) // Only show active families
        .map(family => calculateFamilyInvoice(family, students as any[], settings, grades as any[], courses as any[], hours as any[], payments as Payment[], billAdjustments as BillAdjustment[]))
    : [];

  const calculateTotalRevenue = () => {
    return computedInvoices.reduce((total: number, invoice: any) => {
      return total + invoice.totalPaid;
    }, 0);
  };

  const calculatePendingAmount = () => {
    return computedInvoices.reduce((total: number, invoice: any) => {
      return total + invoice.unpaidBalance;
    }, 0);
  };

  const handlePrintAllInvoices = () => {
    if (!families || !students || !settings || !grades || !courses || !hours || !payments || !billAdjustments) return;
    
    // Cache data for invoice generation
    (window as any).cachedSettings = settings;
    (window as any).cachedStudents = students;
    (window as any).cachedGrades = grades;
    (window as any).cachedCourses = courses;
    (window as any).cachedHours = hours;
    (window as any).cachedPayments = payments;
    (window as any).cachedBillAdjustments = billAdjustments;
    
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
            th, td { padding: 8px 16px; text-align: left; border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; }
            th:last-child, td:last-child { border-right: none; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .amount-column { text-align: right; }
            .subtotal-row { border-top: 1px solid #333; font-weight: bold; background-color: #f9f9f9; }
            .subtotal-row td { padding: 10px 16px; }
            .payment-row { color: #059669; }
            .total-row { border-top: 2px solid #333; font-weight: bold; }
            .total-row td { padding: 15px 16px 8px 16px; }
            .outstanding { background-color: #fef3c7; }
            .overpaid { background-color: #dbeafe; }
            .paid-full { background-color: #d1fae5; }
            .outstanding .amount { color: #dc2626; }
            .overpaid .amount { color: #2563eb; }
            .paid-full .amount { color: #059669; }
          </style>
        </head>
        <body>
          ${invoicePages}
        </body>
      </html>
    `;
  };

  const generateSingleInvoiceHTML = (family: Family, addPageBreak: boolean = false, includeStyles: boolean = false) => {
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
    
    // Get payments and adjustments for this family first
    const familyPayments = ((window as any).cachedPayments?.filter((payment: any) => payment.familyId === family.id) || [])
      .sort((a: any, b: any) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()); // Sort by date, oldest first
    
    const familyAdjustments = ((window as any).cachedBillAdjustments?.filter((adjustment: any) => adjustment.familyId === family.id) || [])
      .sort((a: any, b: any) => new Date(a.adjustmentDate).getTime() - new Date(b.adjustmentDate).getTime()); // Sort by date, oldest first
    
    let invoiceRows = [];
    let total = 0;

    // 1. Add family fee first
    invoiceRows.push({
      name: family.lastName + ' family',
      grade: '',
      hour: '',
      item: 'Family Fee',
      fee: familyFee
    });
    total += familyFee;

    // 2. Add background check fee second (only if needed)
    if (family.needsBackgroundCheck) {
      invoiceRows.push({
        name: family.lastName + ' family',
        grade: '',
        hour: '',
        item: 'Background Check',
        fee: backgroundFee
      });
      total += backgroundFee;
    }

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

    // 5. Add bill adjustments before subtotal
    familyAdjustments.forEach((adjustment: any) => {
      const amount = parseFloat(adjustment.amount);
      const isCredit = amount < 0;
      invoiceRows.push({
        name: family.lastName + ' family',
        grade: new Date(adjustment.adjustmentDate).toLocaleDateString(),
        hour: isCredit ? 'Credit' : 'Charge',
        item: adjustment.description,
        fee: amount
      });
      total += amount;
    });

    const totalPaid = familyPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0);
    const remainingBalance = total - totalPaid; // total already includes adjustments

    // Generate fee rows HTML
    const feeRowsHTML = invoiceRows.map(row => {
      const isCredit = row.fee < 0;
      return `
      <tr${isCredit ? ' class="payment-row"' : ''}>
        <td>${row.name}</td>
        <td>${row.grade}</td>
        <td>${row.hour}</td>
        <td>${row.item}</td>
        <td class="amount-column">${isCredit ? '-$' + Math.abs(row.fee).toFixed(2) : '$' + row.fee.toFixed(2)}</td>
      </tr>
    `;
    }).join('');

    // Generate subtotal row
    const subtotalRowHTML = `
      <tr class="subtotal-row">
        <td colspan="4"><strong>Total Amount</strong></td>
        <td class="amount-column"><strong>$${total.toFixed(2)}</strong></td>
      </tr>
    `;

    // Generate payment rows HTML
    const paymentRowsHTML = familyPayments.length > 0 ? familyPayments.map((payment: any) => `
      <tr class="payment-row">
        <td>${family.lastName} family</td>
        <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
        <td>${payment.paymentMethod || ''}</td>
        <td>Payment Received${payment.description ? ` - ${payment.description}` : ''}</td>
        <td class="amount-column">-$${parseFloat(payment.amount).toFixed(2)}</td>
      </tr>
    `).join('') : '';

    // Combine all rows
    const allRowsHTML = feeRowsHTML + subtotalRowHTML + paymentRowsHTML;

    const stylesHTML = includeStyles ? `
      <style>
        .invoice-header { text-align: center; margin-bottom: 30px; }
        .invoice-header h1 { font-size: 24px; margin: 0; color: #333; }
        .family-name { font-size: 18px; margin: 20px 0; font-weight: bold; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px 16px; text-align: left; border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; }
        th:last-child, td:last-child { border-right: none; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .amount-column { text-align: right; }
        .subtotal-row { border-top: 1px solid #333; font-weight: bold; background-color: #f9f9f9; }
        .subtotal-row td { padding: 10px 16px; }
        .payment-row { color: #059669; }
        .total-row { border-top: 2px solid #333; font-weight: bold; }
        .total-row td { padding: 15px 16px 8px 16px; }
        .outstanding { background-color: #fef3c7; }
        .overpaid { background-color: #dbeafe; }
        .paid-full { background-color: #d1fae5; }
        .outstanding .amount { color: #dc2626; }
        .overpaid .amount { color: #2563eb; }
        .paid-full .amount { color: #059669; }
      </style>
    ` : '';

    return `
      ${stylesHTML}
      ${addPageBreak ? '<div class="page-break"></div>' : ''}
      <div class="invoice-header">
        <h1>CHEC Fees</h1>
      </div>
      <div class="family-name">${family.lastName}, ${family.father || ''} & ${family.mother || ''}</div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Grade</th>
            <th>Hour</th>
            <th>Item</th>
            <th class="amount-column">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${allRowsHTML}
          <tr class="total-row ${remainingBalance > 0 ? 'outstanding' : remainingBalance < 0 ? 'overpaid' : 'paid-full'}">
            <td colspan="4"><strong>${remainingBalance > 0 ? 'Outstanding Balance' : remainingBalance < 0 ? 'Overpaid' : 'Paid in Full'}</strong></td>
            <td class="amount-column amount"><strong>${remainingBalance > 0 ? '$' + remainingBalance.toFixed(2) : remainingBalance < 0 ? '-$' + Math.abs(remainingBalance).toFixed(2) : '$0.00'}</strong></td>
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

  const handleAddPayment = (family: Family) => {
    setSelectedFamilyForPayment(family);
    setPaymentDialogOpen(true);
  };

  const handleAdjustBill = (family: Family) => {
    setSelectedFamilyForAdjustment(family);
    setAdjustBillDialogOpen(true);
  };

  const handleCopyInvoiceLink = async (family: Family) => {
    try {
      const hash = await generateFamilyHash(family.id);
      const url = `${window.location.origin}/invoice/${hash}`;
      
      await navigator.clipboard.writeText(url);
      
      toast({
        title: "Invoice Link Copied",
        description: `Secure invoice link for ${family.lastName} family has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed", 
        description: "Could not copy link to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleBackgroundCheck = (familyId: number) => {
    const family = (families as Family[])?.find(f => f.id === familyId);
    if (family) {
      updateFamilyMutation.mutate({
        id: familyId,
        family: { needsBackgroundCheck: !family.needsBackgroundCheck }
      });
    }
  };

  const handleViewInvoice = (family: Family) => {
    // Cache data for invoice generation
    (window as any).cachedSettings = settings;
    (window as any).cachedStudents = students;
    (window as any).cachedGrades = grades;
    (window as any).cachedCourses = courses;
    (window as any).cachedHours = hours;
    (window as any).cachedPayments = payments;
    (window as any).cachedBillAdjustments = billAdjustments;
    
    setSelectedFamily(family);
    setInvoiceDialogOpen(true);
  };

  return (
    <div>
      <style>{`
        .invoice-grid-header {
          padding: 0.75rem 1rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgb(107 114 128);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          border-bottom: 1px solid rgb(229 231 235);
        }
        .dark .invoice-grid-header {
          color: rgb(156 163 175);
        }
      `}</style>
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
                <th className="invoice-grid-header">Family Name</th>
                <th className="invoice-grid-header">Background Check Fee</th>
                <th className="invoice-grid-header">Total Amount</th>
                <th className="invoice-grid-header">Total Paid</th>
                <th className="invoice-grid-header">Balance</th>
                <th className="invoice-grid-header">Actions</th>
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                      variant={invoice.family.needsBackgroundCheck ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleBackgroundCheck(invoice.family.id)}
                    >
                      {invoice.family.needsBackgroundCheck ? "Required" : "Not Required"}
                    </Button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${invoice.totalPaid.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${invoice.unpaidBalance > 0 ? 'text-red-600' : invoice.unpaidBalance < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                        {invoice.unpaidBalance > 0 ? '$' + invoice.unpaidBalance.toFixed(2) : invoice.unpaidBalance < 0 ? '-$' + Math.abs(invoice.unpaidBalance).toFixed(2) : '$0.00'}
                      </span>
                      {invoice.unpaidBalance === 0 && (
                        <Badge variant="default" className="ml-2">Paid in Full</Badge>
                      )}
                      {invoice.unpaidBalance < 0 && (
                        <Badge variant="secondary" className="ml-2">Overpaid</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewInvoice(invoice.family)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Invoice
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyInvoiceLink(invoice.family)}
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        Copy Invoice Link
                      </Button>
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleAddPayment(invoice.family)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Payment
                      </Button>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAdjustBill(invoice.family)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Adjust Bill
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
                __html: generateSingleInvoiceHTML(selectedFamily, false, true) 
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      {selectedFamilyForPayment && (
        <AddPaymentDialog
          familyId={selectedFamilyForPayment.id}
          familyName={`${selectedFamilyForPayment.father || ''} & ${selectedFamilyForPayment.mother || ''} ${selectedFamilyForPayment.lastName}`}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
        />
      )}

      {/* Adjust Bill Dialog */}
      {selectedFamilyForAdjustment && (
        <AdjustBillDialog
          familyId={selectedFamilyForAdjustment.id}
          familyName={`${selectedFamilyForAdjustment.father || ''} & ${selectedFamilyForAdjustment.mother || ''} ${selectedFamilyForAdjustment.lastName}`}
          open={adjustBillDialogOpen}
          onOpenChange={setAdjustBillDialogOpen}
        />
      )}
      </div>
    </div>
  );
}
