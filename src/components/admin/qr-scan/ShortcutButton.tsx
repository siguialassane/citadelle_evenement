
// Composant pour les boutons raccourcis sur la page de scan QR
import { Button } from "@/components/ui/button";
import React from "react";

interface ShortcutButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export function ShortcutButton({ icon, label, onClick }: ShortcutButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-1 border-gray-300 hover:bg-gray-100"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
