import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PaymentForm from "@/components/forms/payment-form";
import type { InsertPayment } from "@shared/schema";

interface AddPaymentDialogProps {
  familyId: number;
  familyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPaymentDialog({ familyId, familyName, open, onOpenChange }: AddPaymentDialogProps) {
  const handleSubmit = (data: InsertPayment) => {
    // Form will handle the submission
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a payment made by {familyName} family.
          </DialogDescription>
        </DialogHeader>
        <PaymentForm 
          familyId={familyId}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}