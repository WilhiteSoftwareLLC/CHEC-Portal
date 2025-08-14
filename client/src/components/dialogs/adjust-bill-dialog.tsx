import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import BillAdjustmentForm from "@/components/forms/bill-adjustment-form";
import type { InsertBillAdjustment } from "@shared/schema";

interface AdjustBillDialogProps {
  familyId: number;
  familyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdjustBillDialog({ familyId, familyName, open, onOpenChange }: AdjustBillDialogProps) {
  const handleSubmit = (data: InsertBillAdjustment) => {
    // Form will handle the submission
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Bill</DialogTitle>
          <DialogDescription>
            Add a credit or additional charge to {familyName} family's account.
          </DialogDescription>
        </DialogHeader>
        <BillAdjustmentForm 
          familyId={familyId}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}