
// Ce composant affiche le logo de La Citadelle avec une taille ajustable
// Modifications:
// - Création du composant logo réutilisable
// - Options de taille (small, medium, large)
// - Ajout du message "s'unir pour servir"

import React from "react";

interface EventLogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
  showSlogan?: boolean;
}

export const EventLogo: React.FC<EventLogoProps> = ({ 
  size = "medium", 
  className = "",
  showSlogan = true
}) => {
  // Définir les tailles en fonction de l'option
  const sizeClasses = {
    small: "h-12 md:h-16",
    medium: "h-20 md:h-24",
    large: "h-28 md:h-32"
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="text-center">
        <h2 className={`font-bold text-orange-500 ${size === "small" ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}>
          La Citadelle
        </h2>
        {showSlogan && (
          <p className={`text-green-700 italic ${size === "small" ? "text-xs" : "text-sm"}`}>
            s'unir pour servir
          </p>
        )}
      </div>
      <img 
        src="/lovable-uploads/58148cb0-57ab-4c97-98d4-a41ed2de3e7b.png" 
        alt="La Citadelle Logo" 
        className={`${sizeClasses[size]} my-2 object-contain`}
      />
    </div>
  );
};

export default EventLogo;
