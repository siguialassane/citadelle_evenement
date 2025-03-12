
// Composant de sélection des participants pour les emails
import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Eye, EyeOff, User, Users } from "lucide-react";
import { type Participant } from "@/types/participant";

interface ParticipantSelectorProps {
  allParticipants: Participant[];
  selectedParticipants: Participant[];
  hiddenParticipants: string[];
  onSelectParticipant: (participant: Participant, selected: boolean) => void;
  onToggleVisibility: (participantId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function ParticipantSelector({
  allParticipants,
  selectedParticipants,
  hiddenParticipants,
  onSelectParticipant,
  onToggleVisibility,
  onSelectAll,
  onDeselectAll
}: ParticipantSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrer les participants selon le terme de recherche
  const filteredParticipants = allParticipants.filter(participant => {
    const searchText = searchTerm.toLowerCase();
    const isHidden = hiddenParticipants.includes(participant.id);

    if (isHidden) return false;

    return (
      participant.first_name.toLowerCase().includes(searchText) ||
      participant.last_name.toLowerCase().includes(searchText) ||
      participant.email.toLowerCase().includes(searchText) ||
      (participant.contact_number && participant.contact_number.includes(searchTerm))
    );
  });

  // Vérifier si un participant est sélectionné
  const isSelected = (id: string) => selectedParticipants.some(p => p.id === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onSelectAll}
          title="Sélectionner tous les participants visibles"
        >
          <Users className="h-4 w-4 mr-2" />
          Tout sélectionner
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onDeselectAll}
          title="Désélectionner tous les participants"
        >
          <User className="h-4 w-4 mr-2" />
          Tout désélectionner
        </Button>
      </div>

      <div className="rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Téléphone</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map(participant => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected(participant.id)}
                      onCheckedChange={(checked) => {
                        onSelectParticipant(participant, checked as boolean);
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {participant.first_name} {participant.last_name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {participant.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {participant.contact_number}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleVisibility(participant.id)}
                      title="Masquer ce participant"
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm ? "Aucun résultat trouvé." : "Aucun participant visible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hiddenParticipants.length > 0 && (
        <div className="p-2 border rounded bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{hiddenParticipants.length} participant(s) masqué(s)</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => hiddenParticipants.forEach(id => onToggleVisibility(id))}
            >
              <Eye className="h-3 w-3 mr-1" />
              Tout afficher
            </Button>
          </div>
          <div className="mt-1 text-xs text-muted-foreground flex gap-1 flex-wrap">
            {hiddenParticipants.map(id => {
              const participant = allParticipants.find(p => p.id === id);
              return participant ? (
                <span key={id} className="inline-flex items-center bg-background rounded-sm px-1 py-0.5">
                  {participant.first_name} {participant.last_name}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 ml-1"
                    onClick={() => onToggleVisibility(id)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{selectedParticipants.length} participant(s) sélectionné(s)</span>
        <span>{filteredParticipants.length} sur {allParticipants.length - hiddenParticipants.length} participant(s) visible(s)</span>
      </div>
    </div>
  );
}
