import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStudentSchema, type Family, type Student, type InsertStudent } from "@shared/schema";

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: InsertStudent) => void;
  onCancel: () => void;
}

export default function StudentForm({ student, onSubmit, onCancel }: StudentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch families for the dropdown
  const { data: families = [] } = useQuery({
    queryKey: ["/api/families"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      const response = await apiRequest("/api/students", "POST", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create student",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      const response = await apiRequest(`/api/students/${student!.id}`, "PATCH", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", student!.id] });
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      familyId: student?.familyId || 0,
      lastName: student?.lastName || "",
      firstName: student?.firstName || "",
      birthdate: student?.birthdate ? new Date(student.birthdate) : undefined,
      gradYear: student?.gradYear || "",
      comment1: student?.comment1 || "",
      mathHour: student?.mathHour || "",
      firstHour: student?.firstHour || "",
      secondHour: student?.secondHour || "",
      thirdHour: student?.thirdHour || "",
      fourthHour: student?.fourthHour || "",
      fifthHourFall: student?.fifthHourFall || "",
      fifthHourSpring: student?.fifthHourSpring || "",
      fridayScience: student?.fridayScience || "",
    },
  });

  const handleSubmit = (data: InsertStudent) => {
    if (student) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="familyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Family *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a family" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {families.map((family: Family) => (
                      <SelectItem key={family.id} value={family.id.toString()}>
                        {family.lastName}
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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gradYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Graduation Year</FormLabel>
                <FormControl>
                  <Input placeholder="Enter graduation year" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthdate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birth Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mathHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Math Hour</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter math hour assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>1st Hour</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 1st hour assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>2nd Hour</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 2nd hour assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thirdHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>3rd Hour</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 3rd hour assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fourthHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>4th Hour</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 4th hour assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fifthHourFall"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>5th Hour (Fall)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 5th hour fall assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fifthHourSpring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>5th Hour (Spring)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 5th hour spring assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fridayScience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friday Science</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Friday science assignment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="comment1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional comments about the student"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : student ? "Update Student" : "Create Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}