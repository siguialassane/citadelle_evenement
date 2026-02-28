// Formulaire de saisie des noms des invités

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { Guest } from "./types";

type GuestFormProps = {
  guests: Guest[];
  setGuests: (guests: Guest[]) => void;
  participantName: string;
};

export function GuestForm({ guests, setGuests, participantName }: GuestFormProps) {
  // L'invité #1 est le participant principal (affiché en lecture seule)
  // Les invités suivants sont librement éditables

  const updateGuest = (index: number, field: 'first_name' | 'last_name', value: string) => {
    const updated = guests.map((g, i) => 
      i === index ? { ...g, [field]: value } : g
    );
    setGuests(updated);
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
        <UserPlus className="h-5 w-5 mr-2 text-green-600" />
        Noms des participants ({guests.length})
      </h3>

      <div className="space-y-4">
        {guests.map((guest, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-md border ${guest.is_main_participant ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm font-medium ${guest.is_main_participant ? 'text-green-700' : 'text-gray-700'}`}>
                Place {index + 1}
                {guest.is_main_participant && ' — Vous (participant principal)'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Prénom</Label>
                <Input
                  value={guest.first_name}
                  onChange={(e) => updateGuest(index, 'first_name', e.target.value)}
                  disabled={guest.is_main_participant}
                  placeholder="Prénom"
                  className={guest.is_main_participant ? 'bg-green-50' : ''}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Nom</Label>
                <Input
                  value={guest.last_name}
                  onChange={(e) => updateGuest(index, 'last_name', e.target.value)}
                  disabled={guest.is_main_participant}
                  placeholder="Nom"
                  className={guest.is_main_participant ? 'bg-green-50' : ''}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
