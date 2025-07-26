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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertFamilySchema, type Family, type InsertFamily } from "@shared/schema";

interface FamilyFormProps {
  family?: Family;
  onSubmit: (data: InsertFamily) => void;
  onCancel: () => void;
}

export default function FamilyForm({ family, onSubmit, onCancel }: FamilyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: InsertFamily) => {
      const response = await apiRequest("/api/families", "POST", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      toast({
        title: "Success",
        description: "Family created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create family",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertFamily) => {
      const response = await apiRequest(`/api/families/${family!.id}`, "PATCH", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      queryClient.invalidateQueries({ queryKey: ["/api/families", family!.id] });
      toast({
        title: "Success",
        description: "Family updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update family",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertFamily>({
    resolver: zodResolver(insertFamilySchema),
    defaultValues: {
      lastName: family?.lastName || "",
      father: family?.father || "",
      mother: family?.mother || "",
      parentCell: family?.parentCell || "",
      email: family?.email || "",
      address: family?.address || "",
      city: family?.city || "",
      zip: family?.zip || "",
      homePhone: family?.homePhone || "",
      parentCell2: family?.parentCell2 || "",
      secondEmail: family?.secondEmail || "",
      workPhone: family?.workPhone || "",
      church: family?.church || "",
      pastorName: family?.pastorName || "",
      pastorPhone: family?.pastorPhone || "",
    },
  });

  const handleSubmit = (data: InsertFamily) => {
    if (family) {
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
            name="father"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Father's Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter father's name" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mother"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mother's Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter mother's name" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter primary email" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secondEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter secondary email" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentCell"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Cell Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter primary cell phone" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentCell2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Cell Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter secondary cell phone" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="homePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Home Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter home phone" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter work phone" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zip Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter zip code" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="church"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Church</FormLabel>
                <FormControl>
                  <Input placeholder="Enter church name" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pastorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pastor's Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pastor's name" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pastorPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pastor's Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pastor's phone" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : family ? "Update Family" : "Create Family"}
          </Button>
        </div>
      </form>
    </Form>
  );
}