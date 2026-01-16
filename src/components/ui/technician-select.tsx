"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface Technician {
  id: string;
  name: string;
}

interface TechnicianSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}

export function TechnicianSelect({
  value,
  onChange,
  className,
}: TechnicianSelectProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const res = await fetch("/api/analytics/technicians");
        if (res.ok) {
          const json = await res.json();
          setTechnicians(
            json.data.map((t: { id: string; name: string }) => ({
              id: t.id,
              name: t.name,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch technicians:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  return (
    <Select
      value={value ?? "all"}
      onValueChange={(v) => onChange(v === "all" ? null : v)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Loading..." : "All Technicians"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Technicians</SelectItem>
        {technicians.map((tech) => (
          <SelectItem key={tech.id} value={tech.id}>
            {tech.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
