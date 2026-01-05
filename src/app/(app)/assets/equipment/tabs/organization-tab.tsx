"use client";

import { Button } from "@/components/ui/button";
import { FieldGroup, FormGrid } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useMemo } from "react";

interface OrganizationTabProps {
  locationId: string;
  setLocationId: (value: string) => void;
  departmentId: string;
  setDepartmentId: (value: string) => void;
  ownerId: string;
  setOwnerId: (value: string) => void;
  parentId: string;
  setParentId: (value: string) => void;
  parentSearch: string;
  setParentSearch: (value: string) => void;
  locations: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  users: { id: string; name: string }[];
  equipmentList: { id: string; name: string; code: string }[];
  equipmentId?: string;
}

export function OrganizationTab({
  locationId,
  setLocationId,
  departmentId,
  setDepartmentId,
  ownerId,
  setOwnerId,
  parentId,
  setParentId,
  parentSearch,
  setParentSearch,
  locations,
  departments,
  users,
  equipmentList,
  equipmentId,
}: OrganizationTabProps) {
  const filteredParents = useMemo(() => {
    return equipmentList.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
        e.code.toLowerCase().includes(parentSearch.toLowerCase());
      const isNotSelf = e.id !== equipmentId;
      return matchesSearch && isNotSelf;
    });
  }, [equipmentList, parentSearch, equipmentId]);

  const activeParent = useMemo(() => {
    return equipmentList.find((e) => e.id === parentId);
  }, [equipmentList, parentId]);

  return (
    <div className="space-y-6">
      <FormGrid>
        {/* Location */}
        <FieldGroup label="Location" required>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a location..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Department */}
        <FieldGroup label="Responsible Department" required>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Department..." />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Owner */}
        <FieldGroup label="Owner (Optional)" className="md:col-span-2">
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an owner..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Parent Asset */}
        <FieldGroup
          label="Parent Asset (Optional)"
          description="Linking establishes a nested relationship in the asset registry"
          className="md:col-span-2"
        >
          <div className="space-y-2">
            {activeParent && (
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase">
                    Currently Linked To
                  </span>
                  <span className="font-bold">
                    {activeParent.name} ({activeParent.code})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] font-black hover:bg-primary/10"
                  onClick={() => {
                    setParentId("");
                    setParentSearch("");
                  }}
                >
                  DETACH
                </Button>
              </div>
            )}

            {!activeParent && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search to find parent asset..."
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {parentSearch.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
                    {filteredParents.length > 0 ? (
                      filteredParents.slice(0, 10).map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setParentId(e.id);
                            setParentSearch("");
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center justify-between group transition-colors"
                        >
                          <span className="font-medium">{e.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary">
                            {e.code}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                        No matching assets found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </FieldGroup>
      </FormGrid>
    </div>
  );
}
