import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { Family, Payment, BillAdjustment } from "@shared/schema";

interface PublicInvoiceData {
  family: Family;
  students: any[];
  courses: any[];
  grades: any[];
  hours: any[];
  settings: any;
  payments: Payment[];
  billAdjustments: BillAdjustment[];
}

export default function PublicInvoice() {
  const { hash } = useParams<{ hash: string }>();
  const [invoiceData, setInvoiceData] = useState<PublicInvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) {
      setError("Invalid invoice link");
      setIsLoading(false);
      return;
    }

    fetchInvoiceData();
  }, [hash]);

  const fetchInvoiceData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoice/${hash}`, {
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

  const calculateInvoiceDetails = () => {
    if (!invoiceData) return null;

    const { family, students, settings, courses, payments, billAdjustments } = invoiceData;
    
    const familyFee = parseFloat(settings?.FamilyFee || "20");
    const backgroundFee = parseFloat(settings?.BackgroundFee || "0");
    const studentFee = parseFloat(settings?.StudentFee || "20");

    let total = familyFee;
    
    // Add background check fee if needed
    if (family.needsBackgroundCheck) {
      total += backgroundFee;
    }
    
    // Add student fees and course fees
    total += students.length * studentFee;
    
    students.forEach((student: any) => {
      const hourMappings = [
        { field: 'mathHour' },
        { field: 'firstHour' },
        { field: 'secondHour' },
        { field: 'thirdHour' },
        { field: 'fourthHour' },
        { field: 'fifthHourFall' },
        { field: 'fifthHourSpring' },
      ];

      hourMappings.forEach(mapping => {
        const courseName = student[mapping.field];
        if (courseName && courseName !== 'NO_COURSE') {
          const course = courses?.find((c: any) => c.courseName === courseName);
          if (course && course.fee && parseFloat(course.fee) > 0) {
            total += parseFloat(course.fee);
            
            if (course.bookRental && parseFloat(course.bookRental) > 0) {
              total += parseFloat(course.bookRental);
            }
          }
        }
      });
    });

    // Add bill adjustments to total
    const totalAdjustments = billAdjustments.reduce((sum, adjustment) => 
      sum + parseFloat(adjustment.amount.toString()), 0);
    const adjustedTotal = total + totalAdjustments;

    // Calculate payments
    const totalPaid = payments.reduce((sum, payment) => 
      sum + parseFloat(payment.amount.toString()), 0);
    
    const unpaidBalance = adjustedTotal - totalPaid;

    return {
      baseTotal: total,
      totalAdjustments,
      adjustedTotal,
      totalPaid,
      unpaidBalance,
    };
  };

  const generateInvoiceHTML = () => {
    if (!invoiceData) return "";

    const { family, students, settings, courses, hours, billAdjustments } = invoiceData;
    const details = calculateInvoiceDetails();
    if (!details) return "";

    const familyFee = parseFloat(settings?.FamilyFee || "20");
    const backgroundFee = parseFloat(settings?.BackgroundFee || "0");
    const studentFee = parseFloat(settings?.StudentFee || "20");

    // Sort students by gradYear (youngest first)
    const sortedStudents = students.sort((a: any, b: any) => {
      const gradYearA = parseInt(a.gradYear) || 0;
      const gradYearB = parseInt(b.gradYear) || 0;
      return gradYearB - gradYearA;
    });

    let invoiceRows = [];
    let total = 0;

    // Add family fee
    invoiceRows.push({
      name: family.lastName + ' family',
      grade: '',
      hour: '',
      item: 'Family Fee',
      fee: familyFee
    });
    total += familyFee;

    // Add background check fee if needed
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

    // Add student fees and course fees
    sortedStudents.forEach((student: any) => {
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

      // Course fees
      const hourMappings = [
        { field: 'mathHour', hourName: hours?.find((h: any) => h.id === 0)?.description || 'Math' },
        { field: 'firstHour', hourName: hours?.find((h: any) => h.id === 1)?.description || '1st' },
        { field: 'secondHour', hourName: hours?.find((h: any) => h.id === 2)?.description || '2nd' },
        { field: 'thirdHour', hourName: hours?.find((h: any) => h.id === 3)?.description || '3rd' },
        { field: 'fourthHour', hourName: hours?.find((h: any) => h.id === 4)?.description || '4th' },
        { field: 'fifthHourFall', hourName: (hours?.find((h: any) => h.id === 5)?.description || '5th') + ' Fall' },
        { field: 'fifthHourSpring', hourName: (hours?.find((h: any) => h.id === 5)?.description || '5th') + ' Spring' },
      ];

      hourMappings.forEach(mapping => {
        const courseName = student[mapping.field];
        if (courseName && courseName !== 'NO_COURSE') {
          const course = courses?.find((c: any) => c.courseName === courseName);
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

    // Add bill adjustments
    billAdjustments.forEach((adjustment: any) => {
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

    return invoiceRows;
  };

  const getCurrentGradeForStudent = (student: any) => {
    if (!invoiceData?.settings || !invoiceData?.grades || !student.gradYear) return "Unknown";
    
    const schoolYear = parseInt(invoiceData.settings.SchoolYear || "2024");
    const gradeCode = schoolYear - parseInt(student.gradYear) + 13;
    const grade = invoiceData.grades.find((g: any) => g.code === gradeCode);
    return grade ? grade.gradeName : "Unknown";
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handlePayOnline = () => {
    // Placeholder for future online payment integration
    alert("Online payment feature coming soon!");
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

  const details = calculateInvoiceDetails();
  if (!details) return null;

  const invoiceRows = generateInvoiceHTML();
  const { family, payments } = invoiceData;

  // Payment status styling and messaging
  const getPaymentStatus = () => {
    if (details.unpaidBalance > 0) {
      return {
        status: 'outstanding',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <Clock className="h-4 w-4" />,
        message: 'Payment Due'
      };
    } else if (details.unpaidBalance < 0) {
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
            {details.unpaidBalance > 0 && (
              <Button onClick={handlePayOnline} className="bg-green-600 hover:bg-green-700">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Online
              </Button>
            )}
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
                {details.unpaidBalance > 0 && ` $${details.unpaidBalance.toFixed(2)}`}
                {details.unpaidBalance < 0 && ` -$${Math.abs(details.unpaidBalance).toFixed(2)}`}
                {details.unpaidBalance === 0 && " Thank you for your payment!"}
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
                        <td className="py-2 px-4">{row.name}</td>
                        <td className="py-2 px-4">{row.grade}</td>
                        <td className="py-2 px-4">{row.hour}</td>
                        <td className="py-2 px-4">{row.item}</td>
                        <td className={`py-2 px-4 text-right ${isCredit ? 'text-green-600' : ''}`}>
                          {isCredit ? '-$' + Math.abs(row.fee).toFixed(2) : '$' + row.fee.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Total row */}
                  <tr className="border-t-2 border-gray-800 font-semibold bg-gray-50">
                    <td colSpan={4} className="py-3 px-4">Total Amount</td>
                    <td className="py-3 px-4 text-right">${details.adjustedTotal.toFixed(2)}</td>
                  </tr>

                  {/* Payment rows */}
                  {payments.map((payment, index) => (
                    <tr key={`payment-${index}`} className="text-green-600">
                      <td className="py-2 px-4">{family.lastName} family</td>
                      <td className="py-2 px-4">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className="py-2 px-4">{payment.paymentMethod || ''}</td>
                      <td className="py-2 px-4">
                        Payment Received{payment.description ? ` - ${payment.description}` : ''}
                      </td>
                      <td className="py-2 px-4 text-right">-${parseFloat(payment.amount.toString()).toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Balance row */}
                  <tr className={`border-t-2 border-gray-800 font-bold text-lg ${
                    details.unpaidBalance > 0 ? 'bg-red-50 text-red-800' : 
                    details.unpaidBalance < 0 ? 'bg-blue-50 text-blue-800' : 
                    'bg-green-50 text-green-800'
                  }`}>
                    <td colSpan={4} className="py-4 px-4">
                      {details.unpaidBalance > 0 ? 'Outstanding Balance' : 
                       details.unpaidBalance < 0 ? 'Overpaid' : 
                       'Paid in Full'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {details.unpaidBalance > 0 ? '$' + details.unpaidBalance.toFixed(2) : 
                       details.unpaidBalance < 0 ? '-$' + Math.abs(details.unpaidBalance).toFixed(2) : 
                       '$0.00'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment instructions - only show if balance due */}
            {details.unpaidBalance > 0 && (
              <div className="no-print mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Payment Instructions</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Please remit payment of <strong>${details.unpaidBalance.toFixed(2)}</strong> by the due date.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handlePayOnline} size="sm" className="bg-green-600 hover:bg-green-700">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Online
                  </Button>
                  <p className="text-xs text-yellow-600 self-center">
                    Or mail check to the address on file
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}