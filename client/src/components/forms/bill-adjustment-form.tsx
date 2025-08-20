import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBillAdjustmentSchema, type BillAdjustment, type InsertBillAdjustment } from "@shared/schema";
import { z } from "zod";

// Form schema for UI purposes
const billAdjustmentFormSchema = z.object({
  familyId: z.number(),
  adjustmentType: z.enum(["credit", "charge"]),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  adjustmentDate: z.string().min(1, "Date is required"),
});

type BillAdjustmentFormData = z.infer<typeof billAdjustmentFormSchema>;

interface BillAdjustmentFormProps {
  familyId: number;
  adjustment?: BillAdjustment;
  onSubmit: (data: InsertBillAdjustment) => void;
  onCancel: () => void;
}

export default function BillAdjustmentForm({ familyId, adjustment, onSubmit, onCancel }: BillAdjustmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: InsertBillAdjustment) => {
      const response = await apiRequest("/api/bill-adjustments", "POST", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-adjustments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bill-adjustments/family/${familyId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/summary"] });
      toast({
        title: "Success",
        description: "Bill adjustment added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add bill adjustment",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertBillAdjustment) => {
      const response = await apiRequest(`/api/bill-adjustments/${adjustment!.id}`, "PATCH", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-adjustments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bill-adjustments/family/${familyId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/summary"] });
      toast({
        title: "Success", 
        description: "Bill adjustment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bill adjustment",
        variant: "destructive",
      });
    },
  });

  const form = useForm<BillAdjustmentFormData>({
    resolver: zodResolver(billAdjustmentFormSchema),
    defaultValues: adjustment ? {
      familyId: adjustment.familyId,
      adjustmentType: parseFloat(adjustment.amount.toString()) < 0 ? "credit" : "charge",
      amount: Math.abs(parseFloat(adjustment.amount.toString())).toFixed(2),
      description: adjustment.description || "",
      adjustmentDate: adjustment.adjustmentDate,
    } : {
      familyId: familyId,
      adjustmentType: "credit",
      amount: "0.00",
      description: "",
      adjustmentDate: new Date().toISOString().split('T')[0], // Today's date
    },
  });

  const handleSubmit = async (data: BillAdjustmentFormData) => {
    try {
      // Convert form data to database format
      const adjustmentData: InsertBillAdjustment = {
        familyId: data.familyId,
        amount: data.adjustmentType === "credit" ? (-parseFloat(data.amount)).toString() : parseFloat(data.amount).toString(),
        description: data.description,
        adjustmentDate: data.adjustmentDate,
      };

      if (adjustment) {
        await updateMutation.mutateAsync(adjustmentData);
      } else {
        await createMutation.mutateAsync(adjustmentData);
      }
      onSubmit(adjustmentData);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="adjustmentType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Adjustment Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="credit" />
                      <Label className="font-normal">
                        Account Credit (reduces balance)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="charge" />
                      <Label className="font-normal">
                        Additional Charge (increases balance)
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="adjustmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjustment Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter a description for this adjustment..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : adjustment ? "Update Adjustment" : "Add Adjustment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}