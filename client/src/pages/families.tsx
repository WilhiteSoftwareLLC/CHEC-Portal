import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, Users, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AddFamilyDialog from "@/components/dialogs/add-family-dialog";
import type { Family } from "@shared/schema";

export default function Families() {
  const [search, setSearch] = useState("");
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const { toast } = useToast();

  const { data: families, isLoading } = useQuery({
    queryKey: ["/api/families", search],
    queryFn: async () => {
      const url = search ? `/api/families?search=${encodeURIComponent(search)}` : "/api/families";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: async (familyId: number) => {
      await apiRequest(`/api/families/${familyId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      toast({
        title: "Family Deleted",
        description: "Family has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteFamily = (familyId: number) => {
    if (confirm("Are you sure you want to delete this family?")) {
      deleteFamilyMutation.mutate(familyId);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Families</h1>
          <p className="text-sm text-gray-600 mt-1">Manage family information and contacts</p>
        </div>
        <Button 
          onClick={() => setAddFamilyOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Family
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search families..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Families Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {families?.length > 0 ? (
            families.map((family: Family) => (
              <Card key={family.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{family.lastName} Family</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {[family.father, family.mother].filter(Boolean).join(" & ")}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteFamily(family.id)}
                        disabled={deleteFamilyMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {family.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="mr-2 h-4 w-4" />
                        {family.email}
                      </div>
                    )}
                    {(family.parentCell || family.homePhone) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="mr-2 h-4 w-4" />
                        {family.parentCell || family.homePhone}
                      </div>
                    )}
                    {family.address && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {[family.address, family.city, family.zip].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="pt-2">
                      <Badge 
                        variant="secondary" 
                        className={family.active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-600"
                        }
                      >
                        <Users className="mr-1 h-3 w-3" />
                        {family.active ? "Active Family" : "Inactive Family"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No families found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? "Try adjusting your search terms." : "Get started by adding a new family."}
              </p>
              {!search && (
                <div className="mt-6">
                  <Button onClick={() => setAddFamilyOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Family
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AddFamilyDialog open={addFamilyOpen} onOpenChange={setAddFamilyOpen} />
    </div>
  );
}
