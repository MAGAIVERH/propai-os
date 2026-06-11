"use client";

import { useState } from "react";

import { PropertyForm } from "@/modules/properties/components/property-form";
import {
  clearAiPropertyPrefill,
  readAiPropertyPrefill,
} from "@/modules/properties/lib/ai-prefill-storage";
import type { CreatePropertyFormValues } from "@/modules/properties/schemas/create-property";

type PropertyEditFormProps = {
  propertyId: string;
  defaultValues: CreatePropertyFormValues;
};

export function PropertyEditForm({
  propertyId,
  defaultValues,
}: PropertyEditFormProps) {
  const [aiPrefill] = useState<Partial<CreatePropertyFormValues> | undefined>(
    () => {
      const stored = readAiPropertyPrefill(propertyId);

      if (stored) {
        clearAiPropertyPrefill(propertyId);
        return stored;
      }

      return undefined;
    },
  );

  return (
    <PropertyForm
      mode="edit"
      propertyId={propertyId}
      defaultValues={defaultValues}
      aiPrefill={aiPrefill}
    />
  );
}
