
// Composant pour la barre de recherche des paiements
// Extrait pour une meilleure séparation des préoccupations

import React from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

interface PaymentSearchBarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PaymentSearchBar = ({
  searchQuery,
  onSearchChange,
}: PaymentSearchBarProps) => {
  return (
    <div className="relative w-full sm:w-64">
      <Input
        type="text"
        placeholder="Rechercher un participant..."
        value={searchQuery}
        onChange={onSearchChange}
        className="pr-10"
      />
      <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
    </div>
  );
};
