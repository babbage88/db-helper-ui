"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Field({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function BridgeSelect({
  value,
  options,
  disabled = false,
  onChange,
}: {
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const normalizedOptions = React.useMemo(() => {
    const next = new Set(options.length ? options : ["vmbr0"]);
    if (value) next.add(value);
    return [...next].sort();
  }, [options, value]);

  return (
    <Select value={value || normalizedOptions[0]} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select bridge" />
      </SelectTrigger>
      <SelectContent>
        {normalizedOptions.map((bridge) => (
          <SelectItem key={bridge} value={bridge}>
            {bridge}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
