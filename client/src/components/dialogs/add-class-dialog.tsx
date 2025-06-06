import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClassForm from "@/components/forms/class-form";
import { type InsertClass } from "@shared/schema";

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddClassDialog({ open, onOpenChange }: AddClassDialogProps) {
  const handleSubmit = (data: InsertClass) => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
        </DialogHeader>
        <ClassForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}