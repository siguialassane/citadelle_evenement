
// Ce fichier gère le formulaire de paiement manuel
// Il permet aux participants de soumettre une preuve de paiement mobile money
// et envoie une notification à l'administrateur pour validation

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, Copy, Info, PiggyBank, Upload } from "lucide-react";
import emailjs from '@emailjs/browser';

// Définition des constantes
const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// Configuration EmailJS pour le participant
const EMAILJS_SERVICE_ID = "service_is5645q";
const EMAILJS_TEMPLATE_ID = "template_dwx7qnw"; // Template standard

// Configuration EmailJS pour l'admin
const ADMIN_EMAILJS_SERVICE_ID = "service_sxgma2j";
const ADMIN_EMAILJS_TEMPLATE_ID = "template_dp1tu2w"; // Template admin
const ADMIN_EMAILJS_PUBLIC_KEY = "pWG3H0YqA-EKu4hqC";
const ADMIN_EMAIL = "siguialassane93@gmail.com";

// Numéros de paiement
const PAYMENT_NUMBERS = {
  MTN: "0503002817",
  MOOV: "0140229857",
  WAVE: "0503002817" // Même que MTN
};

type PaymentFormProps = {
  participant: any;
};

export function ManualPaymentForm({ participant }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"MTN" | "MOOV" | "WAVE">("MTN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [comments, setComments] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Fonction pour générer une référence de transaction unique
  const generateTransactionReference = () => {
    const prefix = "PAY";
    const participantInitials = `${participant.first_name.charAt(0)}${participant.last_name.charAt(0)}`;
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${participantInitials}-${randomDigits}`;
  };

  // Référence de transaction (générée une seule fois)
  const [transactionReference] = useState(generateTransactionReference());

  // Fonction pour copier du texte dans le presse-papier
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied({ ...isCopied, [key]: true });
      setTimeout(() => {
        setIsCopied({ ...isCopied, [key]: false });
      }, 2000);
    });
  };

  // Fonction pour uploader la capture d'écran à Supabase Storage
  const uploadScreenshot = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `payment_proofs/${fileName}`;

      // Uploader le fichier à Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Erreur lors de l'upload de la capture d'écran:", uploadError);
        throw new Error("Échec de l'upload de l'image. Veuillez réessayer.");
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      return null;
    }
  };

  // Fonction pour envoyer l'email de notification à l'administrateur
  const sendAdminNotification = async (manualPaymentId: string, screenshotUrl: string) => {
    try {
      console.log("Envoi de notification à l'administrateur...");
      
      const adminLink = `${window.location.origin}/admin/payment-validation/${manualPaymentId}`;

      const templateParams = {
        to_email: ADMIN_EMAIL,
        from_name: "Système d'Inscription IFTAR",
        participant_name: `${participant.first_name} ${participant.last_name}`,
        participant_email: participant.email,
        participant_phone: participant.contact_number,
        payment_amount: `${PAYMENT_AMOUNT} XOF`,
        payment_method: paymentMethod,
        transaction_reference: transactionReference,
        payment_phone: phoneNumber,
        screenshot_url: screenshotUrl,
        comments: comments || "Aucun commentaire",
        validation_link: adminLink,
        // Variables requises par EmailJS
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };

      console.log("Paramètres pour EmailJS (admin):", templateParams);

      const response = await emailjs.send(
        ADMIN_EMAILJS_SERVICE_ID,
        ADMIN_EMAILJS_TEMPLATE_ID,
        templateParams,
        ADMIN_EMAILJS_PUBLIC_KEY
      );

      console.log("Email de notification admin envoyé avec succès:", response);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email à l'administrateur:", error);
      return false;
    }
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsProcessing(true);

      // Validation des champs
      if (!phoneNumber) {
        toast({
          title: "Champ requis",
          description: "Veuillez saisir le numéro utilisé pour le paiement",
          variant: "destructive",
        });
        return;
      }

      if (!screenshot) {
        toast({
          title: "Capture d'écran requise",
          description: "Veuillez télécharger une capture d'écran de votre paiement",
          variant: "destructive",
        });
        return;
      }

      // 1. Upload de la capture d'écran
      console.log("Téléchargement de la capture d'écran...");
      const screenshotUrl = await uploadScreenshot(screenshot);
      
      if (!screenshotUrl) {
        throw new Error("Échec du téléchargement de la capture d'écran. Veuillez réessayer.");
      }

      // 2. Enregistrer le paiement manuel dans la base de données
      console.log("Enregistrement du paiement manuel...");
      const { data: manualPayment, error: paymentError } = await supabase
        .from('manual_payments')
        .insert({
          participant_id: participant.id,
          amount: PAYMENT_AMOUNT,
          payment_method: paymentMethod,
          phone_number: phoneNumber,
          screenshot_url: screenshotUrl,
          comments: comments,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Erreur lors de l'enregistrement du paiement:", paymentError);
        throw new Error("Échec de l'enregistrement du paiement. Veuillez réessayer.");
      }

      console.log("Paiement manuel enregistré:", manualPayment);

      // 3. Envoyer une notification à l'administrateur
      await sendAdminNotification(manualPayment.id, screenshotUrl);

      // 4. Afficher un message de succès
      toast({
        title: "Preuve de paiement soumise avec succès",
        description: "Votre demande est en attente de validation par un administrateur. Vous recevrez un email de confirmation une fois validée.",
        variant: "default",
      });

      // 5. Rediriger vers une page d'attente
      setTimeout(() => {
        navigate(`/payment-pending/${participant.id}`);
      }, 2000);

    } catch (error: any) {
      console.error("Erreur lors du traitement du paiement manuel:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Gérer le changement de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale autorisée est de 5 Mo",
          variant: "destructive",
        });
        return;
      }
      setScreenshot(file);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">
          Paiement Mobile Money
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Étape 1: Choisir le mode de paiement */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
              Choisissez votre méthode de paiement
            </h3>
            
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value: "MTN" | "MOOV" | "WAVE") => setPaymentMethod(value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "MTN" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
                <RadioGroupItem value="MTN" id="mtn" className="sr-only" />
                <Label htmlFor="mtn" className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <PiggyBank className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-medium">MTN Mobile Money</div>
                    <div className="text-sm text-gray-500 mt-2">{PAYMENT_NUMBERS.MTN}</div>
                  </div>
                </Label>
              </div>
              
              <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "MOOV" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
                <RadioGroupItem value="MOOV" id="moov" className="sr-only" />
                <Label htmlFor="moov" className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <PiggyBank className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-medium">Moov Money</div>
                    <div className="text-sm text-gray-500 mt-2">{PAYMENT_NUMBERS.MOOV}</div>
                  </div>
                </Label>
              </div>
              
              <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "WAVE" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
                <RadioGroupItem value="WAVE" id="wave" className="sr-only" />
                <Label htmlFor="wave" className="cursor-pointer w-full">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <PiggyBank className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-medium">Wave</div>
                    <div className="text-sm text-gray-500 mt-2">{PAYMENT_NUMBERS.WAVE}</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Étape 2: Instructions de paiement */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
              Effectuez votre paiement
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Montant à payer:</span>
                  <span className="font-bold text-green-700">{PAYMENT_AMOUNT.toLocaleString()} XOF</span>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Numéro de réception:</span>
                  <div className="flex items-center">
                    <span className="mr-2">{PAYMENT_NUMBERS[paymentMethod]}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(PAYMENT_NUMBERS[paymentMethod], 'number')}
                    >
                      {isCopied['number'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Référence à indiquer:</span>
                  <div className="flex items-center">
                    <span className="mr-2 font-mono bg-gray-100 px-2 py-1 rounded">{transactionReference}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(transactionReference, 'reference')}
                    >
                      {isCopied['reference'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <Info className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  <p><strong>Important:</strong> Veuillez inclure la référence exacte ci-dessus lors de votre paiement. Après avoir effectué le transfert, prenez une capture d'écran de la confirmation et téléchargez-la ci-dessous.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Étape 3: Formulaire de soumission de la preuve */}
          <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">3</span>
              Soumettez votre preuve de paiement
            </h3>
            
            <div className="space-y-4">
              {/* Numéro utilisé pour le paiement */}
              <div>
                <Label htmlFor="phoneNumber" className="block mb-1">
                  Numéro utilisé pour le paiement <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="text"
                  placeholder="Ex: 0701234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              {/* Upload de capture d'écran */}
              <div>
                <Label htmlFor="screenshot" className="block mb-1">
                  Capture d'écran de la confirmation <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="screenshot" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-medium">Cliquez pour télécharger</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG ou PDF (max. 5 Mo)</p>
                    </div>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/png, image/jpeg, application/pdf"
                      onChange={handleFileChange}
                      required
                      className="hidden"
                    />
                  </label>
                </div>
                {screenshot && (
                  <p className="mt-2 text-sm text-green-600">
                    Fichier sélectionné: {screenshot.name}
                  </p>
                )}
              </div>
              
              {/* Commentaires (optionnel) */}
              <div>
                <Label htmlFor="comments" className="block mb-1">
                  Commentaires (optionnel)
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Ajoutez des informations supplémentaires si nécessaire"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full"
                  rows={3}
                />
              </div>
              
              {/* Bouton de soumission */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement en cours...
                  </>
                ) : (
                  "Soumettre ma preuve de paiement"
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start text-xs text-gray-500">
        <p>
          La validation de votre paiement peut prendre jusqu'à 24 heures. Vous recevrez un email de confirmation une fois le paiement validé.
        </p>
      </CardFooter>
    </Card>
  );
}
