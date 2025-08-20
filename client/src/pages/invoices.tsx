import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, DollarSign, Eye, Plus, Settings, Link2, Printer, Mail } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import AddPaymentDialog from "@/components/dialogs/add-payment-dialog";
import AdjustBillDialog from "@/components/dialogs/adjust-bill-dialog";
import { generateFamilyHash } from "@/lib/invoice-utils";
import type { Family } from "@shared/schema";

export default function Invoices() {
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceHTML, setInvoiceHTML] = useState<string>("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [printingAllInvoices, setPrintingAllInvoices] = useState(false);
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
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/summary"] });
    },
  });

  const sendFamilyEmailMutation = useMutation({
    mutationFn: async (familyId: number) => {
      const response = await fetch("/api/email/send-family-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          testMode: true, 
          testFamilyId: familyId 
        })
      });
      
      if (!response.ok) {
        throw new Error(`Email send failed: ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (response, familyId) => {
      const family = (families as Family[])?.find(f => f.id === familyId);
      const familyName = family?.lastName || 'Unknown';
      
      if (response.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Invoice and schedule links sent to ${familyName} family.`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: `Failed to send email to ${familyName} family: ${response.error}`,
          variant: "destructive",
        });
      }
    },
    onError: (error, familyId) => {
      const family = (families as Family[])?.find(f => f.id === familyId);
      const familyName = family?.lastName || 'Unknown';
      
      toast({
        title: "Email Error",
        description: `Error sending email to ${familyName} family: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const { data: invoiceSummaries } = useQuery({
    queryKey: ["/api/invoices/summary"],
    retry: false,
  });

  const { data: families } = useQuery({
    queryKey: ["/api/families"],
    retry: false,
  });

  // Use invoice summaries directly from the server
  const computedInvoices = Array.isArray(invoiceSummaries) ? invoiceSummaries : [];

  const calculateTotalRevenue = () => {
    return computedInvoices.reduce((total: number, invoice: any) => {
      return total + invoice.totalPaid;
    }, 0);
  };

  const calculatePendingAmount = () => {
    return computedInvoices.reduce((total: number, invoice: any) => {
      return total + invoice.balance;
    }, 0);
  };

  const handlePrintAllInvoices = async () => {
    try {
      setPrintingAllInvoices(true);
      
      if (!families || !Array.isArray(families)) {
        toast({
          title: "Error",
          description: "Unable to load family data for printing",
          variant: "destructive",
        });
        return;
      }

      const activeFamilies = (families as Family[]).filter(f => f.active !== false);
      
      toast({
        title: "Generating Invoices",
        description: `Preparing ${activeFamilies.length} invoices for printing...`,
      });

      // Generate HTML for all families with invoices
      let allInvoicesHTML = `
        <html>
          <head>
            <title>CHEC All Invoices</title>
            <style>
              body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 0; }
              .invoice-container { margin: 20px; }
              .invoice-container:not(:first-child) { page-break-before: always; }
              .invoice-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .family-info { font-size: 16px; font-weight: bold; margin-bottom: 20px; }
              .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .invoice-table th, .invoice-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              .invoice-table th { background-color: #f5f5f5; font-weight: bold; }
              .total-row { background-color: #f0f0f0; font-weight: bold; }
              .balance-row { background-color: #fff2f0; font-weight: bold; font-size: 14px; }
              .balance-paid { background-color: #f0fff0; }
              .balance-overpaid { background-color: #f0f8ff; }
              .credit-amount { color: #16a085; }
              .text-right { text-align: right; }
              @media print {
                .invoice-container:not(:first-child) { page-break-before: always; }
              }
            </style>
          </head>
          <body>
      `;

      // Generate invoices for all families
      for (let i = 0; i < activeFamilies.length; i++) {
        const family = activeFamilies[i];
        const invoiceHTML = await generateSingleInvoiceHTML(family, i > 0, false);
        allInvoicesHTML += invoiceHTML;
      }

      allInvoicesHTML += `
          </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(allInvoicesHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        toast({
          title: "Print Error",
          description: "Unable to open print window. Please check your browser's popup settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error printing all invoices:', error);
      toast({
        title: "Print Error",
        description: "Failed to generate invoices for printing",
        variant: "destructive",
      });
    } finally {
      setPrintingAllInvoices(false);
    }
  };


  const generateSingleInvoiceHTML = async (family: Family, addPageBreak: boolean = false, includeStyles: boolean = false): Promise<string> => {
    try {
      // Fetch invoice data from server
      const response = await fetch(`/api/invoices/family/${family.id}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        return `<div class="p-4 text-red-600">Error loading invoice for ${family.lastName} family</div>`;
      }
      
      const invoiceData = await response.json();
      const { calculation, invoiceRows } = invoiceData;
      
      const pageBreakStyle = addPageBreak ? 'page-break-before: always;' : '';
      const styles = includeStyles ? `
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; }
          .invoice-container { margin: 20px; ${pageBreakStyle} }
          .invoice-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .family-info { font-size: 16px; font-weight: bold; margin-bottom: 20px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .invoice-table th, .invoice-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          .invoice-table th { background-color: #f5f5f5; font-weight: bold; }
          .total-row { background-color: #f0f0f0; font-weight: bold; }
          .balance-row { background-color: #fff2f0; font-weight: bold; font-size: 14px; }
          .balance-paid { background-color: #f0fff0; }
          .balance-overpaid { background-color: #f0f8ff; }
          .credit-amount { color: #16a085; }
          .text-right { text-align: right; }
        </style>
      ` : '';
      
      return `
        ${styles}
        <div class="invoice-container">
          <div class="invoice-header">
            <h1>CHEC Fees</h1>
          </div>
          
          <div class="family-info">
            ${family.lastName}, ${family.father || ''} & ${family.mother || ''}
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                <th>Hour</th>
                <th>Item</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceRows.map((row: any) => {
                const isCredit = row.fee < 0;
                return `
                  <tr>
                    <td>${row.studentName || family.lastName + ' family'}</td>
                    <td>${row.grade || ''}</td>
                    <td>${row.hour || ''}</td>
                    <td>${row.itemDescription}</td>
                    <td class="text-right ${isCredit ? 'credit-amount' : ''}">
                      ${isCredit ? '-$' + Math.abs(row.fee).toFixed(2) : '$' + row.fee.toFixed(2)}
                    </td>
                  </tr>
                `;
              }).join('')}
              
              <!-- Total Amount Row -->
              <tr class="total-row">
                <td colspan="4">Total Amount</td>
                <td class="text-right">$${calculation.totalAmount.toFixed(2)}</td>
              </tr>
              
              <!-- Payment Rows -->
              ${invoiceData.payments.map((payment: any) => `
                <tr class="credit-amount">
                  <td>Payment</td>
                  <td>${new Date(payment.paymentDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                  <td>${payment.paymentMethod || ''}</td>
                  <td>Payment Received${payment.description ? ` - ${payment.description}` : ''}</td>
                  <td class="text-right">-$${parseFloat(payment.amount.toString()).toFixed(2)}</td>
                </tr>
              `).join('')}
              
              <!-- Balance Row -->
              <tr class="balance-row ${calculation.balance === 0 ? 'balance-paid' : calculation.balance < 0 ? 'balance-overpaid' : ''}">
                <td colspan="4">
                  ${calculation.balance > 0 ? 'Outstanding Balance' : 
                    calculation.balance < 0 ? 'Overpaid' : 
                    'Paid in Full'}
                </td>
                <td class="text-right">
                  ${calculation.balance > 0 ? '$' + calculation.balance.toFixed(2) : 
                    calculation.balance < 0 ? '-$' + Math.abs(calculation.balance).toFixed(2) : 
                    '$0.00'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      console.error('Error generating invoice HTML:', error);
      return `<div class="p-4 text-red-600">Error generating invoice for ${family.lastName} family</div>`;
    }
  };

  const handleAddPayment = (family: Family) => {
    setSelectedFamilyForPayment(family);
    setPaymentDialogOpen(true);
  };

  const handleAdjustBill = (family: Family) => {
    setSelectedFamilyForAdjustment(family);
    setAdjustBillDialogOpen(true);
  };

  const handleEmailFamily = (family: Family) => {
    if (!family.email || family.email.trim() === '') {
      toast({
        title: "No Email Address",
        description: `${family.lastName} family does not have an email address on file.`,
        variant: "destructive",
      });
      return;
    }

    const confirmMessage = `Send invoice and schedule links to ${family.lastName} family (${family.email})?`;
    if (window.confirm(confirmMessage)) {
      sendFamilyEmailMutation.mutate(family.id);
    }
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

  const handleViewInvoice = async (family: Family) => {
    setSelectedFamily(family);
    setInvoiceDialogOpen(true);
    setInvoiceLoading(true);
    setInvoiceHTML("");
    
    try {
      const html = await generateSingleInvoiceHTML(family, false, true);
      setInvoiceHTML(html);
    } catch (error) {
      console.error('Error loading invoice:', error);
      setInvoiceHTML(`<div class="p-4 text-red-600">Error loading invoice for ${family.lastName} family</div>`);
    } finally {
      setInvoiceLoading(false);
    }
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
          label: printingAllInvoices ? "Generating Invoices..." : "Print All Invoices",
          onClick: handlePrintAllInvoices,
          icon: Printer,
          disabled: printingAllInvoices
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
                  ${calculateTotalRevenue().toFixed(2)}
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
                  ${calculatePendingAmount().toFixed(2)}
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
                <tr key={invoice.familyId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {invoice.lastName}, {invoice.father || ''} & {invoice.mother || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                      variant={invoice.needsBackgroundCheck ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleBackgroundCheck(invoice.familyId)}
                    >
                      {invoice.needsBackgroundCheck ? "Required" : "Not Required"}
                    </Button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${invoice.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${invoice.totalPaid.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${invoice.balance > 0 ? 'text-red-600' : invoice.balance < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                        {invoice.balance > 0 ? '$' + invoice.balance.toFixed(2) : invoice.balance < 0 ? '-$' + Math.abs(invoice.balance).toFixed(2) : '$0.00'}
                      </span>
                      {invoice.balance === 0 && (
                        <Badge variant="default" className="ml-2">Paid in Full</Badge>
                      )}
                      {invoice.balance < 0 && (
                        <Badge variant="secondary" className="ml-2">Overpaid</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        title="View Invoice"
                        onClick={() => {
                          const family = (families as Family[])?.find(f => f.id === invoice.familyId);
                          if (family) handleViewInvoice(family);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        title="Copy Invoice Link"
                        onClick={() => {
                          const family = (families as Family[])?.find(f => f.id === invoice.familyId);
                          if (family) handleCopyInvoiceLink(family);
                        }}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        title={sendFamilyEmailMutation.isPending ? "Sending..." : "Email Links"}
                        onClick={() => {
                          const family = (families as Family[])?.find(f => f.id === invoice.familyId);
                          if (family) handleEmailFamily(family);
                        }}
                        disabled={sendFamilyEmailMutation.isPending}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const family = (families as Family[])?.find(f => f.id === invoice.familyId);
                          if (family) handleAddPayment(family);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Payment
                      </Button>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const family = (families as Family[])?.find(f => f.id === invoice.familyId);
                          if (family) handleAdjustBill(family);
                        }}
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
          {invoiceLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span>Loading invoice...</span>
            </div>
          )}
          {!invoiceLoading && selectedFamily && (
            <div 
              className="border rounded-lg p-6 bg-white"
              dangerouslySetInnerHTML={{ 
                __html: invoiceHTML 
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
