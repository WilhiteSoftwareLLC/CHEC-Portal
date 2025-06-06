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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertClassSchema, type Class, type InsertClass, type Grade } from "@shared/schema";

interface ClassFormProps {
  classData?: Class;
  onSubmit: (data: InsertClass) => void;
  onCancel: () => void;
}

export default function ClassForm({ classData, onSubmit, onCancel }: ClassFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: grades } = useQuery({
    queryKey: ["/api/grades"],
    queryFn: async () => {
      const response = await fetch("/api/grades", { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClass) => {
      const response = await apiRequest("/api/classes", "POST", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertClass) => {
      const response = await apiRequest(`/api/classes/${classData!.id}`, "PATCH", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classData!.id] });
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertClass>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      className: classData?.className || "",
      startCode: classData?.startCode || null,
      endCode: classData?.endCode || null,
    },
  });

  const handleSubmit = (data: InsertClass) => {
    if (classData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
    onSubmit(data);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="className"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter class name"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Grade</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                value={field.value ? String(field.value) : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select start grade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {grades?.map((grade: Grade) => (
                    <SelectItem key={grade.id} value={String(grade.code)}>
                      {grade.gradeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Grade</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                value={field.value ? String(field.value) : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select end grade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {grades?.map((grade: Grade) => (
                    <SelectItem key={grade.id} value={String(grade.code)}>
                      {grade.gradeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : classData ? "Update Class" : "Create Class"}
          </Button>
        </div>
      </form>
    </Form>
  );
}