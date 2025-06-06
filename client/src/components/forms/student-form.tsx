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
import { insertStudentSchema, type Family, type Student, type InsertStudent, type Course } from "@shared/schema";

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

  // Create queries for courses by hour (1-8)
  const { data: hour1Courses = [] } = useQuery({
    queryKey: ["/api/courses/by-hour/1"],
  });
  const { data: hour2Courses = [] } = useQuery({
    queryKey: ["/api/courses/by-hour/2"],
  });
  const { data: hour3Courses = [] } = useQuery({
    queryKey: ["/api/courses/by-hour/3"],
  });
  const { data: hour4Courses = [] } = useQuery({
    queryKey: ["/api/courses/by-hour/4"],
  });
  const { data: hour5Courses = [] } = useQuery({
    queryKey: ["/api/courses/by-hour/5"],
  });
  const { data: hour6Courses = [] } = useQuery({
    queryKey: ["/api/courses/by-hour/6"],
  });
  const { data: hour7Courses = [] } = useQuery({
    queryKey: ["/api/courses/by-hour/7"],
  });
  const { data: hour8Courses = [] } = useQuery({
    queryKey: ["/api/courses/by-hour/8"],
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
    // Convert "NO_COURSE" values to null for database storage
    const processedData = {
      ...data,
      mathHour: data.mathHour === "NO_COURSE" ? null : data.mathHour,
      firstHour: data.firstHour === "NO_COURSE" ? null : data.firstHour,
      secondHour: data.secondHour === "NO_COURSE" ? null : data.secondHour,
      thirdHour: data.thirdHour === "NO_COURSE" ? null : data.thirdHour,
      fourthHour: data.fourthHour === "NO_COURSE" ? null : data.fourthHour,
      fifthHourFall: data.fifthHourFall === "NO_COURSE" ? null : data.fifthHourFall,
      fifthHourSpring: data.fifthHourSpring === "NO_COURSE" ? null : data.fifthHourSpring,
      fridayScience: data.fridayScience === "NO_COURSE" ? null : data.fridayScience,
    };
    
    if (student) {
      updateMutation.mutate(processedData);
    } else {
      createMutation.mutate(processedData);
    }
    onSubmit(processedData);
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
          <h3 className="text-lg font-semibold">Schedule - Select Courses by Hour</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>1st Hour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course for 1st hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course selected</SelectItem>
                      {(hour1Courses as Course[]).map((course) => (
                        <SelectItem key={course.id} value={course.courseName}>
                          {course.courseName} - {course.location}
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
              name="secondHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>2nd Hour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course for 2nd hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course selected</SelectItem>
                      {(hour2Courses as Course[]).map((course) => (
                        <SelectItem key={course.id} value={course.courseName}>
                          {course.courseName} - {course.location}
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
              name="thirdHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>3rd Hour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course for 3rd hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course selected</SelectItem>
                      {(hour3Courses as Course[]).map((course) => (
                        <SelectItem key={course.id} value={course.courseName}>
                          {course.courseName} - {course.location}
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
              name="fourthHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>4th Hour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course for 4th hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course selected</SelectItem>
                      {(hour4Courses as Course[]).map((course) => (
                        <SelectItem key={course.id} value={course.courseName}>
                          {course.courseName} - {course.location}
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
              name="fifthHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>5th Hour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course for 5th hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course selected</SelectItem>
                      {(hour5Courses as Course[]).map((course) => (
                        <SelectItem key={course.id} value={course.courseName}>
                          {course.courseName} - {course.location}
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
              name="sixthHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>6th Hour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course for 6th hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course selected</SelectItem>
                      {(hour6Courses as Course[]).map((course) => (
                        <SelectItem key={course.id} value={course.courseName}>
                          {course.courseName} - {course.location}
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
              name="seventhHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>7th Hour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course for 7th hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course selected</SelectItem>
                      {(hour7Courses as Course[]).map((course) => (
                        <SelectItem key={course.id} value={course.courseName}>
                          {course.courseName} - {course.location}
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
              name="eighthHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>8th Hour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course for 8th hour" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course selected</SelectItem>
                      {(hour8Courses as Course[]).map((course) => (
                        <SelectItem key={course.id} value={course.courseName}>
                          {course.courseName} - {course.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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