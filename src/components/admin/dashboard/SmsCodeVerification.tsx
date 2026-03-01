import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, CheckCircle2, XCircle, Users, Phone, Mail, CreditCard, Loader2, UserCheck } from "lucide-react";
import { lookupBySmsCode } from "@/services/smsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SmsCodeVerificationProps {
  onParticipantFound?: (participant: any) => void;
  onCheckIn?: (participantId: string) => void;
  onRefresh?: () => void;
}

const SmsCodeVerification = ({ onParticipantFound, onCheckIn, onRefresh }: SmsCodeVerificationProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const participant = await lookupBySmsCode(code);
      
      if (participant) {
        setResult(participant);
        setNotFound(false);
        onParticipantFound?.(participant);
      } else {
        setNotFound(true);
        setResult(null);
      }
    } catch (error) {
      console.error("Erreur recherche SMS code:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la recherche.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!result) return;
    
    setCheckingIn(true);
    try {
      // Mettre à jour le check_in_status du participant
      const { error } = await supabase
        .from('participants')
        .update({ 
          check_in_status: true,
          check_in_timestamp: new Date().toISOString()
        })
        .eq('id', result.id);

      if (error) throw error;

      // Insérer dans check_ins
      await supabase
        .from('check_ins')
        .insert({
          participant_id: result.id,
          checked_in_at: new Date().toISOString(),
          method: 'sms_code'
        });

      // Mettre à jour les accompagnants aussi
      if (result.guests?.length > 0) {
        await supabase
          .from('guests')
          .update({
            check_in_status: true,
            check_in_timestamp: new Date().toISOString()
          })
          .eq('participant_id', result.id);
      }

      toast({
        title: "Présence validée !",
        description: `${result.first_name} ${result.last_name} a été enregistré(e) comme présent(e).`,
      });

      // Rafraîchir le résultat
      setResult({ ...result, check_in_status: true });
      onCheckIn?.(result.id);
      onRefresh?.();
    } catch (error) {
      console.error("Erreur check-in via SMS:", error);
      toast({
        title: "Erreur",
        description: "Impossible de valider la présence.",
        variant: "destructive",
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase et limiter à 10 caractères
    setCode(e.target.value.toUpperCase().slice(0, 10));
  };

  const getPaymentStatus = () => {
    if (!result?.manual_payments?.length) return null;
    const latestPayment = result.manual_payments[0];
    return latestPayment.status;
  };

  const companions = result?.guests?.filter((g: any) => !g.is_main_participant) || [];
  const totalPlaces = companions.length + 1;

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
      <CardContent className="pt-4 pb-4">
        {/* Titre + Input */}
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800 text-sm">Vérification par code SMS</h3>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
            <Input
              placeholder="Saisir le code SMS (ex: SIG-4291)"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              className="pl-9 border-orange-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !code.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vérifier"}
          </Button>
        </div>

        {/* Résultat: pas trouvé */}
        {notFound && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">
              Aucun participant trouvé pour le code <span className="font-bold">{code}</span>. Vérifiez le code et réessayez.
            </p>
          </div>
        )}

        {/* Résultat: trouvé */}
        {result && (
          <div className="mt-3 p-3 bg-white border border-orange-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Nom + badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-gray-900">
                    {result.last_name} {result.first_name}
                  </h4>
                  {totalPlaces > 1 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Users className="h-3 w-3 mr-1" />
                      {totalPlaces} places
                    </Badge>
                  )}
                  {result.is_member && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Membre
                    </Badge>
                  )}
                  {result.check_in_status ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Présent
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600">
                      Non enregistré
                    </Badge>
                  )}
                </div>

                {/* Infos de contact */}
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {result.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {result.contact_number}
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {getPaymentStatus() === 'completed' ? (
                      <span className="text-green-600 font-medium">Paiement validé</span>
                    ) : getPaymentStatus() === 'pending' ? (
                      <span className="text-yellow-600 font-medium">Paiement en attente</span>
                    ) : (
                      <span className="text-red-600 font-medium">Paiement rejeté</span>
                    )}
                  </div>
                </div>

                {/* Accompagnants */}
                {companions.length > 0 && (
                  <div className="mt-2 pl-3 border-l-2 border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Accompagnants:</p>
                    {companions.map((guest: any) => (
                      <div key={guest.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-700">{guest.first_name} {guest.last_name}</span>
                        {guest.check_in_status ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton valider présence */}
              <div className="ml-4 flex-shrink-0">
                {!result.check_in_status ? (
                  <Button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {checkingIn ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-1" />
                    )}
                    Valider présence
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    Déjà enregistré
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmsCodeVerification;
