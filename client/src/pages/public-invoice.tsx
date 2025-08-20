import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Clock, Download } from "lucide-react";
import type { Family, Payment, BillAdjustment } from "@shared/schema";
import type { FamilyInvoice } from "@shared/invoice-types";



declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PublicInvoice() {
  const { hash } = useParams<{ hash: string }>();
  const [invoiceData, setInvoiceData] = useState<FamilyInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const paypalButtonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hash) {
      setError("Invalid invoice link");
      setIsLoading(false);
      return;
    }

    fetchInvoiceData();
  }, [hash]);

  useEffect(() => {
    // Load PayPal SDK
    const loadPayPalSDK = () => {
      if (window.paypal) {
        setPaypalLoaded(true);
        return;
      }

      const script = document.createElement('script');
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=buttons`;
      script.onload = () => setPaypalLoaded(true);
      script.onerror = () => console.error('Failed to load PayPal SDK');
      document.head.appendChild(script);
    };

    if (invoiceData) {
      if (invoiceData.calculation.balance > 0) {
        loadPayPalSDK();
      }
    }
  }, [invoiceData]);

  useEffect(() => {
    // Render PayPal buttons when SDK is loaded and we have invoice data
    if (paypalLoaded && invoiceData && paypalButtonsRef.current) {
      // Calculate PayPal amount (for now, use balance - will be updated to use server calculation)
      const paypalAmount = invoiceData.calculation.balanceWithPayPal || invoiceData.calculation.balance;
      if (paypalAmount > 0) {
        renderPayPalButtons(paypalAmount);
      }
    }
  }, [paypalLoaded, invoiceData]);

  const fetchInvoiceData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoices/${hash}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Invoice not found or has expired");
        }
        throw new Error(`Failed to load invoice: ${response.status}`);
      }

      const data = await response.json();
      setInvoiceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  };

  // Invoice details are now calculated server-side
  const getInvoiceDetails = () => {
    if (!invoiceData) return null;
    return invoiceData.calculation;
  };

  // Invoice rows are now generated server-side
  const getInvoiceRows = () => {
    if (!invoiceData) return [];
    return invoiceData.invoiceRows;
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const renderPayPalButtons = (amount: number) => {
    if (!window.paypal || !paypalButtonsRef.current) return;

    // Clear existing buttons
    paypalButtonsRef.current.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay'
      },
      createOrder: async () => {
        try {
          setIsProcessingPayment(true);
          const response = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: amount.toFixed(2),
              familyId: invoiceData!.family.id,
              invoiceHash: hash
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create PayPal order');
          }

          const data = await response.json();
          return data.orderID;
        } catch (error) {
          console.error('Error creating PayPal order:', error);
          setError('Failed to initialize payment. Please try again.');
          setIsProcessingPayment(false);
          throw error;
        }
      },
      onApprove: async (data: any) => {
        try {
          const response = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderID: data.orderID,
              familyId: invoiceData!.family.id
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to capture PayPal payment');
          }

          const captureData = await response.json();
          
          // Refresh invoice data to show updated payment status
          await fetchInvoiceData();
          
          setError(null);
          alert('Payment successful! Thank you for your payment.');
        } catch (error) {
          console.error('Error capturing PayPal payment:', error);
          setError(`Payment failed to process. ${error}`);
        } finally {
          setIsProcessingPayment(false);
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        setError(`Payment failed. ${err}`);
        setIsProcessingPayment(false);
      },
      onCancel: () => {
        setIsProcessingPayment(false);
      }
    }).render(paypalButtonsRef.current);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Invoice Not Found</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Please check your link or contact the administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoiceData) return null;

  const details = getInvoiceDetails();
  if (!details) return null;

  const invoiceRows = getInvoiceRows();
  const { family, payments } = invoiceData;

  // Payment status styling and messaging
  const getPaymentStatus = () => {
    if (details.balance > 0) {
      return {
        status: 'outstanding',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <Clock className="h-4 w-4" />,
        message: 'Payment Due'
      };
    } else if (details.balance < 0) {
      return {
        status: 'overpaid',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: <CheckCircle className="h-4 w-4" />,
        message: 'Overpaid'
      };
    } else {
      return {
        status: 'paid',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle className="h-4 w-4" />,
        message: 'Paid in Full'
      };
    }
  };

  const paymentStatus = getPaymentStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .bg-gray-50 { background: white !important; }
          .container { padding: 0.5rem !important; }
          .py-8 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .px-4 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
          .text-2xl { font-size: 1.25rem !important; }
          .text-xl { font-size: 1.125rem !important; }
          .text-lg { font-size: 1rem !important; }
          .text-sm { font-size: 0.75rem !important; }
          .py-3 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
          .py-2 { padding-top: 0.125rem !important; padding-bottom: 0.125rem !important; }
          .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .px-4 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
          .mb-6 { margin-bottom: 0.75rem !important; }
          .mb-4 { margin-bottom: 0.5rem !important; }
          .mb-2 { margin-bottom: 0.25rem !important; }
          .p-6 { padding: 0.75rem !important; }
          table { font-size: 0.8rem !important; }
          th, td { padding: 0.125rem 0.25rem !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header with actions - hidden in print */}
        <div className="no-print mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Family Invoice</h1>
            <p className="text-gray-600">
              {family.lastName}, {family.father || ''} & {family.mother || ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrintInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>

        {/* Payment status alert - hidden in print */}
        <div className="no-print mb-6">
          <Alert className={`${paymentStatus.bgColor} ${paymentStatus.borderColor}`}>
            <div className="flex items-center">
              <span className={paymentStatus.color}>
                {paymentStatus.icon}
              </span>
              <AlertDescription className={`ml-2 ${paymentStatus.color} font-medium`}>
                {paymentStatus.message}: 
                {details.balance > 0 && ` $${details.balance.toFixed(2)}`}
                {details.balance < 0 && ` -$${Math.abs(details.balance).toFixed(2)}`}
                {details.balance === 0 && " Thank you for your payment!"}
              </AlertDescription>
            </div>
          </Alert>
        </div>

        {/* Invoice content */}
        <Card>
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl">CHEC Fees</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                {family.lastName}, {family.father || ''} & {family.mother || ''}
              </h2>
            </div>

            {/* Invoice table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Grade</th>
                    <th className="text-left py-3 px-4 font-semibold">Hour</th>
                    <th className="text-left py-3 px-4 font-semibold">Item</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceRows.map((row, index) => {
                    const isCredit = row.fee < 0;
                    return (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2 px-4 whitespace-nowrap">{row.studentName || family.lastName + ' family'}</td>
                        <td className="py-2 px-4">{row.grade || ''}</td>
                        <td className="py-2 px-4">{row.hour || ''}</td>
                        <td className="py-2 px-4">{row.itemDescription}</td>
                        <td className={`py-2 px-4 text-right whitespace-nowrap ${isCredit ? 'text-green-600' : ''}`}>
                          {isCredit ? '-$' + Math.abs(row.fee).toFixed(2) : '$' + row.fee.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Total row */}
                  <tr className="border-t-2 border-gray-800 font-semibold bg-gray-50">
                    <td colSpan={4} className="py-3 px-4">Total Amount</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">${details.totalAmount.toFixed(2)}</td>
                  </tr>

                  {/* PayPal fee row - only show if unpaid balance exists */}
                  {details.balance > 0 && details.paypalFee && (
                    <tr className="border-b border-gray-200 text-blue-600">
                      <td className="py-2 px-4 whitespace-nowrap">{family.lastName} family</td>
                      <td className="py-2 px-4"></td>
                      <td className="py-2 px-4">Online</td>
                      <td className="py-2 px-4">PayPal Processing Fee</td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">${details.paypalFee.toFixed(2)}</td>
                    </tr>
                  )}

                  {/* PayPal total row - only show if unpaid balance exists */}
                  {details.balance > 0 && details.totalWithPayPal && (
                    <tr className="border-t border-gray-400 font-semibold bg-blue-50 text-blue-800">
                      <td colSpan={4} className="py-3 px-4">Total with PayPal Fee</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">${details.totalWithPayPal.toFixed(2)}</td>
                    </tr>
                  )}

                  {/* Payment rows */}
                  {payments.map((payment, index) => (
                    <tr key={`payment-${index}`} className="text-green-600">
                      <td className="py-2 px-4 whitespace-nowrap">Payment</td>
                      <td className="py-2 px-4">{new Date(payment.paymentDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                      <td className="py-2 px-4">{payment.paymentMethod || ''}</td>
                      <td className="py-2 px-4">
                        Payment Received{payment.description ? ` - ${payment.description}` : ''}
                      </td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">-${parseFloat(payment.amount.toString()).toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Balance row */}
                  <tr className={`border-t-2 border-gray-800 font-bold text-lg ${
                    details.balance > 0 ? 'bg-red-50 text-red-800' : 
                    details.balance < 0 ? 'bg-blue-50 text-blue-800' : 
                    'bg-green-50 text-green-800'
                  }`}>
                    <td colSpan={4} className="py-4 px-4">
                      {details.balance > 0 ? 'Outstanding Balance' : 
                       details.balance < 0 ? 'Overpaid' : 
                       'Paid in Full'}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {details.balance > 0 ? '$' + details.balance.toFixed(2) : 
                       details.balance < 0 ? '-$' + Math.abs(details.balance).toFixed(2) : 
                       '$0.00'}
                    </td>
                  </tr>

                  {/* PayPal balance row - only show if unpaid balance exists */}
                  {details.balance > 0 && details.balanceWithPayPal && (
                    <tr className="border-t border-blue-400 font-bold text-lg bg-blue-100 text-blue-900">
                      <td colSpan={4} className="py-4 px-4">PayPal Payment Amount</td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">${details.balanceWithPayPal.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment instructions - only show if balance due */}
            {details.balance > 0 && (
              <div className="no-print mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Payment Instructions</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Please remit payment of <strong>${details.balance.toFixed(2)}</strong> at or before orientation.
                </p>
                <p className="text-xs text-yellow-600 mb-2">
                  Pay with check or cash at orientation, or pay securely online with PayPal below.
                </p>
                {details.paypalFee && details.balanceWithPayPal && (
                  <p className="text-xs text-blue-600 mb-4">
                    <strong>PayPal Payment: ${details.balanceWithPayPal.toFixed(2)}</strong> (includes processing fee)
                  </p>
                )}
                
                {/* PayPal buttons container */}
                <div ref={paypalButtonsRef} className="mt-4"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}