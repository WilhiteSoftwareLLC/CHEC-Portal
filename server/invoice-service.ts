import type { IStorage } from "./storage";
import type { Family } from "@shared/schema";
import type { 
  InvoiceCalculation, 
  InvoiceRow, 
  FamilyInvoice, 
  InvoiceSummary, 
  PayPalCalculation 
} from "@shared/invoice-types";

export class InvoiceService {
  constructor(private storage: IStorage) {}

  /**
   * Calculate detailed invoice for a single family
   */
  async calculateFamilyInvoice(familyId: number, includePayPal: boolean = false): Promise<FamilyInvoice | null> {
    try {
      // Get all necessary data for the family invoice
      const [
        family,
        students,
        courses,
        grades,
        hours,
        settings,
        payments,
        billAdjustments
      ] = await Promise.all([
        this.storage.getFamily(familyId),
        this.storage.getStudentsByFamily(familyId),
        this.storage.getCourses(),
        this.storage.getGrades(),
        this.storage.getHours(),
        this.storage.getSettings(),
        this.storage.getPaymentsByFamily(familyId),
        this.storage.getBillAdjustmentsByFamily(familyId)
      ]);

      if (!family || !students || !courses || !grades || !hours || !settings) {
        return null;
      }

      // Settings is already a Record<string, string>

      const familyFee = parseFloat(settings?.FamilyFee || "0");
      const backgroundFee = parseFloat(settings?.BackgroundFee || "0");
      const studentFee = parseFloat(settings?.StudentFee || "0");

      // Filter active students and sort by gradYear (youngest first)
      const activeStudents = students.filter(s => !s.inactive).sort((a, b) => {
        const gradYearA = parseInt(a.gradYear || '0') || 0;
        const gradYearB = parseInt(b.gradYear || '0') || 0;
        return gradYearB - gradYearA; // Higher gradYear = younger student
      });

      // Generate invoice rows and calculate totals
      const invoiceRows: InvoiceRow[] = [];
      let totalAmount = 0;

      // 1. Family fee
      invoiceRows.push({
        itemType: 'family',
        itemDescription: 'Family Fee',
        fee: familyFee
      });
      totalAmount += familyFee;

      // 2. Background check fee if needed
      if (family.needsBackgroundCheck) {
        invoiceRows.push({
          itemType: 'background',
          itemDescription: 'Background Check',
          fee: backgroundFee
        });
        totalAmount += backgroundFee;
      }

      // 3. Student fees and course fees
      for (const student of activeStudents) {
        const currentGrade = this.getCurrentGradeForStudent(student, settings, grades);
        
        // Student fee
        invoiceRows.push({
          studentName: student.firstName,
          grade: currentGrade,
          itemType: 'student',
          itemDescription: 'Student Fee',
          fee: studentFee
        });
        totalAmount += studentFee;

        // Course fees
        const hourMappings = [
          { field: 'mathHour', hourName: hours.find(h => h.id === 0)?.description || 'Math' },
          { field: 'firstHour', hourName: hours.find(h => h.id === 1)?.description || '1st' },
          { field: 'secondHour', hourName: hours.find(h => h.id === 2)?.description || '2nd' },
          { field: 'thirdHour', hourName: hours.find(h => h.id === 3)?.description || '3rd' },
          { field: 'fourthHour', hourName: hours.find(h => h.id === 4)?.description || '4th' },
          { field: 'fifthHourFall', hourName: (hours.find(h => h.id === 5)?.description || '5th') + ' Fall' },
          { field: 'fifthHourSpring', hourName: (hours.find(h => h.id === 5)?.description || '5th') + ' Spring' },
        ];

        for (const mapping of hourMappings) {
          const courseName = (student[mapping.field as keyof typeof student] as string) || null;
          if (courseName && courseName !== 'NO_COURSE') {
            const course = courses.find(c => c.courseName === courseName);
            if (course) {
              // Course fee
              if (course.fee && parseFloat(course.fee) > 0) {
                const courseFee = parseFloat(course.fee);
                invoiceRows.push({
                  studentName: student.firstName,
                  grade: currentGrade,
                  hour: mapping.hourName,
                  courseName,
                  itemType: 'course',
                  itemDescription: courseName,
                  fee: courseFee
                });
                totalAmount += courseFee;
              }

              // Book rental fee
              if (course.bookRental && parseFloat(course.bookRental) > 0) {
                const bookRentalFee = parseFloat(course.bookRental);
                invoiceRows.push({
                  studentName: student.firstName,
                  grade: currentGrade,
                  hour: mapping.hourName,
                  courseName,
                  itemType: 'book',
                  itemDescription: `${courseName} - Book Rental`,
                  fee: bookRentalFee
                });
                totalAmount += bookRentalFee;
              }
            }
          }
        }
      }

      // 4. Bill adjustments
      const sortedAdjustments = billAdjustments.sort((a, b) => 
        new Date(a.adjustmentDate).getTime() - new Date(b.adjustmentDate).getTime()
      );

      for (const adjustment of sortedAdjustments) {
        const amount = parseFloat(adjustment.amount.toString());
        invoiceRows.push({
          itemType: 'adjustment',
          itemDescription: adjustment.description,
          fee: amount
        });
        totalAmount += amount;
      }

      // Calculate payments
      const totalPaid = payments.reduce((sum, payment) => 
        sum + parseFloat(payment.amount.toString()), 0
      );
      const balance = totalAmount - totalPaid;

      // Base calculation
      const calculation: InvoiceCalculation = {
        totalAmount,
        totalPaid,
        balance
      };

      // PayPal calculation if requested
      if (includePayPal && balance > 0 && settings?.PayPalPercentage && settings?.PayPalFixedRate) {
        const paypalPercentage = parseFloat(settings.PayPalPercentage) / 100;
        const paypalFixedRate = parseFloat(settings.PayPalFixedRate);
        const paypalFee = (balance * paypalPercentage) + paypalFixedRate;
        
        calculation.paypalFee = paypalFee;
        calculation.totalWithPayPal = totalAmount + paypalFee;
        calculation.balanceWithPayPal = calculation.totalWithPayPal - totalPaid;
      }

      return {
        family,
        calculation,
        invoiceRows,
        payments,
        billAdjustments
      };
    } catch (error) {
      console.error("Error calculating family invoice:", error);
      throw error;
    }
  }

  /**
   * Generate invoice summaries for all active families
   */
  async calculateAllFamilySummaries(): Promise<InvoiceSummary[]> {
    try {
      const families = await this.storage.getFamilies();
      const activeFamilies = families.filter(f => f.active !== false);
      
      const summaries: InvoiceSummary[] = [];
      
      for (const family of activeFamilies) {
        const invoice = await this.calculateFamilyInvoice(family.id);
        if (invoice) {
          // Find last payment date
          const lastPaymentDate = invoice.payments.length > 0 
            ? invoice.payments.sort((a, b) => 
                new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
              )[0].paymentDate
            : undefined;

          // Determine payment status
          let paymentStatus: 'paid' | 'partial' | 'unpaid' | 'overpaid';
          if (invoice.calculation.balance === 0) {
            paymentStatus = 'paid';
          } else if (invoice.calculation.balance < 0) {
            paymentStatus = 'overpaid';
          } else if (invoice.calculation.totalPaid > 0) {
            paymentStatus = 'partial';
          } else {
            paymentStatus = 'unpaid';
          }

          summaries.push({
            familyId: family.id,
            lastName: family.lastName,
            father: family.father || undefined,
            mother: family.mother || undefined,
            needsBackgroundCheck: family.needsBackgroundCheck || false,
            totalAmount: invoice.calculation.totalAmount,
            totalPaid: invoice.calculation.totalPaid,
            balance: invoice.calculation.balance,
            lastPaymentDate: lastPaymentDate ? lastPaymentDate.toString() : undefined,
            paymentStatus
          });
        }
      }

      return summaries.sort((a, b) => a.lastName.localeCompare(b.lastName));
    } catch (error) {
      console.error("Error calculating family summaries:", error);
      throw error;
    }
  }

  /**
   * Calculate PayPal-specific fees for a family
   */
  async calculatePayPalFees(familyId: number): Promise<PayPalCalculation | null> {
    try {
      const invoice = await this.calculateFamilyInvoice(familyId, true);
      if (!invoice || !invoice.calculation.paypalFee) {
        return null;
      }

      return {
        paypalFee: invoice.calculation.paypalFee,
        totalWithPayPal: invoice.calculation.totalWithPayPal!,
        balanceWithPayPal: invoice.calculation.balanceWithPayPal!
      };
    } catch (error) {
      console.error("Error calculating PayPal fees:", error);
      throw error;
    }
  }

  /**
   * Get family invoice by hash (for public access)
   */
  async getFamilyInvoiceByHash(hash: string, includePayPal: boolean = false): Promise<FamilyInvoice | null> {
    try {
      // Find family ID using the existing storage method
      const familyId = await this.storage.findFamilyByHash(hash);
      if (!familyId) {
        return null;
      }

      return await this.calculateFamilyInvoice(familyId, includePayPal);
    } catch (error) {
      console.error("Error getting family invoice by hash:", error);
      throw error;
    }
  }

  /**
   * Helper method to determine current grade for a student
   */
  private getCurrentGradeForStudent(student: any, settings: any, grades: any[]): string {
    if (!settings || !grades || !student.gradYear) {
      return "Unknown";
    }
    
    const schoolYear = parseInt(settings.SchoolYear || "2024");
    const gradeCode = schoolYear - parseInt(student.gradYear) + 13;
    const grade = grades.find(g => g.code === gradeCode);
    return grade ? grade.gradeName : "Unknown";
  }

}
