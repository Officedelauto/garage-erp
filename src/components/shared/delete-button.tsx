"use client";

import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Supprimer",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
}) {
  return <ConfirmSubmitButton action={action} confirmMessage={confirmMessage} label={label} variant="destructive" />;
}
