import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CourseForm from "@/components/forms/course-form";
import type { InsertCourse } from "@shared/schema";

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCourseDialog({ open, onOpenChange }: AddCourseDialogProps) {
  const handleSubmit = (data: InsertCourse) => {
    // Form will handle the submission
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Create a new course with instructor details, schedule, and enrollment information.
          </DialogDescription>
        </DialogHeader>
        <CourseForm 
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
