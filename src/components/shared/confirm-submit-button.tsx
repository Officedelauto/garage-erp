"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

export function ConfirmSubmitButton({
  action,
  confirmMessage,
  label,
  variant = "outline",
  size = "sm",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant={variant} size={size}>
        {label}
      </Button>
    </form>
  );
}
