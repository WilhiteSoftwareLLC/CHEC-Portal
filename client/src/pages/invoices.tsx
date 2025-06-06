import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, FileText, Download, PrinterCheck, DollarSign, Calendar, Users } from "lucide-react";
import type { Family } from "@shared/schema";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    retry: false,
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

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter((invoice: any) => {
    if (statusFilter && statusFilter !== "all" && invoice.status !== statusFilter) {
      return false;
    }
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
        invoice.family?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) : [];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "$0.00";
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateTotalRevenue = () => {
    return Array.isArray(invoices) ? invoices.reduce((total: number, invoice: any) => {
      if (invoice.status === 'paid') {
        return total + parseFloat(invoice.total || "0");
      }
      return total;
    }, 0) : 0;
  };

  const calculatePendingAmount = () => {
    return Array.isArray(invoices) ? invoices.reduce((total: number, invoice: any) => {
      if (invoice.status === 'pending') {
        return total + parseFloat(invoice.total || "0");
      }
      return total;
    }, 0) : 0;
  };

  const handleExportInvoices = () => {
    // TODO: Implement invoice export functionality
    console.log("Exporting invoices...");
  };

  const handlePrintInvoice = (invoiceId: number) => {
    // TODO: Implement invoice printing functionality
    console.log("Printing invoice:", invoiceId);
  };

  const handlePrintAllInvoices = () => {
    if (!families || !students || !settings || !grades) return;
    
    // Cache data for invoice generation
    (window as any).cachedSettings = settings;
    (window as any).cachedStudents = students;
    (window as any).cachedGrades = grades;
    
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

    // Get students for this family
    const familyStudents = (window as any).cachedStudents?.filter((s: any) => s.familyId === family.id) || [];

    let invoiceRows = [];
    let total = 0;

    // Add family fee
    invoiceRows.push({
      name: `${family.father || ''} & ${family.mother || ''}`.trim() || family.lastName,
      grade: '',
      hour: '',
      item: 'Family Fee',
      fee: familyFee
    });
    total += familyFee;

    // Add background check fee
    invoiceRows.push({
      name: `${family.father || ''} & ${family.mother || ''}`.trim() || family.lastName,
      grade: '',
      hour: '',
      item: 'Background Check',
      fee: backgroundFee
    });
    total += backgroundFee;

    // Add student fees and course fees
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

      // Course fees (placeholder - would need actual course fee data)
      if (student.mathHour) {
        invoiceRows.push({
          name: student.firstName,
          grade: currentGrade,
          hour: 'Math',
          item: student.mathHour,
          fee: 15 // placeholder fee
        });
        total += 15;
      }

      if (student.firstHour) {
        invoiceRows.push({
          name: student.firstName,
          grade: currentGrade,
          hour: '1st',
          item: student.firstHour,
          fee: 25 // placeholder fee
        });
        total += 25;
      }

      if (student.secondHour) {
        invoiceRows.push({
          name: student.firstName,
          grade: currentGrade,
          hour: '2nd',
          item: student.secondHour,
          fee: 25 // placeholder fee
        });
        total += 25;
      }

      if (student.thirdHour) {
        invoiceRows.push({
          name: student.firstName,
          grade: currentGrade,
          hour: '3rd',
          item: student.thirdHour,
          fee: 25 // placeholder fee
        });
        total += 25;
      }

      if (student.fourthHour) {
        invoiceRows.push({
          name: student.firstName,
          grade: currentGrade,
          hour: '4th',
          item: student.fourthHour,
          fee: 25 // placeholder fee
        });
        total += 25;
      }
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
    const settings = (window as any).cachedSettings;
    const grades = (window as any).cachedGrades;
    
    if (!settings || !grades || !student.gradYear) return "Unknown";
    
    const schoolYear = parseInt(settings.SchoolYear || "2024");
    const gradeCode = schoolYear - parseInt(student.gradYear) + 13;
    const grade = grades.find((g: any) => g.code === gradeCode);
    return grade ? grade.gradeName : "Unknown";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-600 mt-1">Manage billing and payments</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportInvoices}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handlePrintAllInvoices}>
            <PrinterCheck className="mr-2 h-4 w-4" />
            Print All Invoices
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(calculateTotalRevenue().toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="text-yellow-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(calculatePendingAmount().toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Array.isArray(invoices) ? invoices.length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="w-16 h-4" />
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-16 h-4" />
                  <Skeleton className="w-20 h-6" />
                </div>
              ))}
            </div>
          ) : filteredInvoices?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Invoice #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Family</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                    <th className="relative py-3 px-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice: any) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-gray-600">
                              {invoice.family.name[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.family.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {invoice.family.primaryContact}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </div>
                        {invoice.items.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePrintInvoice(invoice.id)}
                          >
                            <PrinterCheck className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || statusFilter
                  ? "Try adjusting your search terms or filters."
                  : "Get started by creating your first invoice."}
              </p>
              {!search && !statusFilter && (
                <div className="mt-6">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
