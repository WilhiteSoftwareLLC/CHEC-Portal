import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import FamilyForm from "@/components/forms/family-form";
import type { InsertFamily } from "@shared/schema";

interface AddFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFamilyDialog({ open, onOpenChange }: AddFamilyDialogProps) {
  const handleSubmit = (data: InsertFamily) => {
    // Form will handle the submission
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Family</DialogTitle>
          <DialogDescription>
            Add a new family to the homeschool cooperative with contact information.
          </DialogDescription>
        </DialogHeader>
        <FamilyForm 
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
