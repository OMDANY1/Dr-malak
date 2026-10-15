"use client";

import React from "react";
import { useConsultationDialog } from "./ConsultationDialogContext";

interface ConsultationTriggerButtonProps {
  label: string;
  topicId?: string;
  variant?: "primary" | "secondary" | "ivory" | "outline-ivory";
  className?: string;
  fallbackHref: string;
  onTrigger?: () => void;
}

export function ConsultationTriggerButton({
  label,
  topicId = "general",
  variant = "primary",
  className = "",
  fallbackHref,
  onTrigger,
}: ConsultationTriggerButtonProps) {
  const dialog = useConsultationDialog();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (dialog) {
      e.preventDefault();
      onTrigger?.();
      dialog.openDialog(topicId, e.currentTarget);
    }
  };

  return (
    <a
      href={fallbackHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-haspopup="dialog"
      className={`btn btn-${variant} ${className}`.trim()}
      onClick={handleClick}
    >
      {label}
    </a>
  );
}
