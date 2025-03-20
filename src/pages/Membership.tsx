// Formulaire d'adhésion pour les participants
// Mise à jour:
// - Correction des erreurs de redéclaration de variables sectionStyle et sectionTitleStyle
// - Amélioration de la compatibilité mobile du formulaire
// - Optimisation de l'affichage des sections sur les petits écrans
// - Amélioration de la taille des champs de saisie et boutons sur mobile
// - Ajustement de l'espacement et de la lisibilité pour les écrans tactiles
// - Correction du problème d'inscription avec Mobile Money
// - Ajout de messages d'erreur plus clairs

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { sendMembershipRequestAdminEmail, sendMembershipRequestParticipantEmail } from '@/components/manual-payment/services/emailService';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, ArrowLeft, LucideCalculator, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CLUB_EXPECTATIONS, ClubExpectationType } from '@/components/manual-payment/services/emails/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';

// Schéma de validation pour le formulaire d'adhésion
const membershipFormSchema = z.object({
  // Informations personnelles
  first_name: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
  last_name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Email invalide' }),
  contact_number: z.string().min(8, { message: 'Numéro de téléphone invalide' }),
  profession: z.string().min(2, { message: 'Veuillez indiquer votre profession' }),
  address: z.string().optional(),
  
  // Information de souscription
  subscription_amount: z.preprocess(
    (val) => (val === '' ? 100000 : Number(val)), 
    z.number().min(1, { message: 'Le montant doit être supérieur à 0' })
  ),
  subscription_start_month: z.string().optional(),
  
  // Mode de règlement
  payment_method: z.enum(['especes', 'cheque', 'virement', 'mobile_money'], { 
    message: 'Veuillez sélectionner un mode de règlement valide' 
  }),
  
  // Périodicité
  payment_frequency: z.enum(['mensuelle', 'trimestrielle', 'annuelle'], { 
    message: 'Veuillez sélectionner une périodicité valide' 
  }),
  
  // Domaines de compétence et attentes
  competence_domains: z.string().optional(),
  
  // Case à cocher pour les attentes
  formation: z.boolean().default(false),
  loisirs: z.boolean().default(false),
  echanges: z.boolean().default(false),
  reseau: z.boolean().default(false),
  
  other_expectations: z.string().optional(),
  
  // Accord des conditions
  agree_terms: z.boolean().refine(val => val === true, { 
    message: 'Vous devez accepter les conditions' 
  })
});

type MembershipFormValues = z.infer<typeof membershipFormSchema>;

// Fonction pour calculer le montant périodique
const calculatePeriodicAmount = (totalAmount: number, frequency: string): number => {
  switch (frequency) {
    case 'mensuelle':
      return Math.round(totalAmount / 12);
    case 'trimestrielle':
      return Math.round(totalAmount / 4);
    case 'annuelle':
      return totalAmount;
    default:
      return totalAmount;
  }
};

// Fonction pour obtenir le nombre de mois restants dans l'année
const getRemainingMonths = (startMonth: string): number => {
  if (!startMonth) return 12;
  
  const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 
                  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
  const startIndex = months.indexOf(startMonth);
  if (startIndex === -1) return 12;
  
  return 12 - startIndex;
};

const MembershipForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [periodicAmount, setPeriodicAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(100000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      contact_number: '',
      profession: '',
      address: '',
      subscription_amount: 100000,
      subscription_start_month: '',
      payment_method: 'especes',
      payment_frequency: 'mensuelle',
      competence_domains: '',
      formation: false,
      loisirs: false,
      echanges: false,
      reseau: false,
      other_expectations: '',
      agree_terms: false
    }
  });

  // Mise à jour du calcul lorsque les champs pertinents changent
  useEffect(() => {
    const totalAmount = form.getValues('subscription_amount') || 100000;
    const frequency = form.getValues('payment_frequency') || 'mensuelle';
    const startMonth = form.getValues('subscription_start_month') || '';
    
    const periodAmount = calculatePeriodicAmount(totalAmount, frequency);
    setPeriodicAmount(periodAmount);
    
    const remainingMonths = getRemainingMonths(startMonth);
    const proRatedAmount = Math.round(totalAmount * (remainingMonths / 12));
    setRemainingAmount(proRatedAmount);
  }, [
    form.watch('subscription_amount'),
    form.watch('payment_frequency'),
    form.watch('subscription_start_month')
  ]);

  // Réinitialiser le message d'erreur lorsque la méthode de paiement change
  useEffect(() => {
    setErrorMessage(null);
  }, [form.watch('payment_method')]);

  const handleSubmit = async (values: MembershipFormValues) => {
    console.log("Soumission du formulaire avec les valeurs:", values);
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      // Collecter les attentes comme un tableau pour la base de données
      const clubExpectationsArray: string[] = [];
      if (values.formation) clubExpectationsArray.push("Formation");
      if (values.loisirs) clubExpectationsArray.push("Loisirs");
      if (values.echanges) clubExpectationsArray.push("Échanges et débats");
      if (values.reseau) clubExpectationsArray.push("Appartenir à un réseau");

      console.log("Création d'un nouvel enregistrement d'adhésion...");
      // Créer un nouvel enregistrement d'adhésion
      const { data: newMembership, error: insertError } = await supabase
        .from('memberships')
        .insert({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          contact_number: values.contact_number,
          profession: values.profession,
          address: values.address || null,
          subscription_amount: values.subscription_amount,
          subscription_start_month: values.subscription_start_month || null,
          payment_method: values.payment_method,
          payment_frequency: values.payment_frequency,
          competence_domains: values.competence_domains || null,
          club_expectations: clubExpectationsArray,
          other_expectations: values.other_expectations || null,
          status: 'pending',
          requested_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Erreur lors de l'insertion de l'adhésion:", insertError);
        
        // Analyser l'erreur pour un message plus spécifique
        if (insertError.message.includes('check constraint')) {
          if (insertError.message.includes('payment_method')) {
            setErrorMessage("Le mode de règlement sélectionné n'est pas valide. Veuillez en choisir un autre.");
          } else {
            setErrorMessage("Une contrainte de validation a échoué. Veuillez vérifier vos informations.");
          }
        } else {
          setErrorMessage(insertError.message);
        }
        
        throw insertError;
      }
      
      console.log("Nouvel enregistrement d'adhésion créé:", newMembership);
      
      // Vérifier si un participant avec cet email existe déjà
      const { data: existingParticipant, error: participantQueryError } = await supabase
        .from('participants')
        .select('id')
        .eq('email', values.email)
        .maybeSingle();
      
      if (participantQueryError) {
        console.error("Erreur lors de la vérification du participant:", participantQueryError);
        // Continuons sans lier à un participant existant
      }
      
      let participantId = existingParticipant?.id;
      
      // Si le participant n'existe pas, nous n'en créons pas automatiquement un nouveau
      // Nous utilisons simplement l'ID de l'adhésion pour les e-mails
      
      // Si le participant existe, mettons à jour l'adhésion avec l'id du participant
      if (participantId) {
        const { error: updateError } = await supabase
          .from('memberships')
          .update({ participant_id: participantId })
          .eq('id', newMembership.id);
        
        if (updateError) {
          console.error("Erreur lors de la mise à jour de l'adhésion avec l'id du participant:", updateError);
          // Continuons malgré l'erreur
        }
      }
      
      console.log("Envoi des emails de notification...");
      // Envoyer des emails de notification
      const adminEmailSent = await sendMembershipRequestAdminEmail(
        { ...newMembership, id: participantId || newMembership.id }
      );
      const participantEmailSent = await sendMembershipRequestParticipantEmail(
        { ...newMembership, id: participantId || newMembership.id }
      );
      
      if (!adminEmailSent || !participantEmailSent) {
        console.warn("Problème lors de l'envoi des emails de notification");
      }
      
      console.log("Emails envoyés, marquage comme succès");
      // Marquer comme succès
      setIsSuccess(true);
      
      // Afficher un message de succès
      toast({
        title: "Demande envoyée",
        description: "Votre demande d'adhésion a été envoyée avec succès. Vous recevrez une réponse par email.",
      });
      
    } catch (error: any) {
      console.error("Erreur lors de la soumission de la demande d'adhésion:", error);
      
      // Utiliser le message d'erreur personnalisé s'il existe, sinon un message générique
      const errorMsg = errorMessage || "Une erreur est survenue lors de la soumission de votre demande. Veuillez réessayer.";
      
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Style commun pour les sections avec responsive
  const sectionStyle = "border border-gray-300 rounded-md p-3 md:p-4 mb-4 md:mb-6 relative mt-6";
  const sectionTitleStyle = "text-base md:text-lg font-medium -mt-5 md:-mt-7 bg-white px-2 inline-block absolute top-0 left-4";

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-xl md:text-2xl">Demande envoyée avec succès</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-6">
            <div className="flex justify-center my-6">
              <UserPlus className="h-16 w-16 md:h-20 md:w-20 text-amber-600" />
            </div>
            <p className="mb-4 text-sm md:text-base">
              Votre demande d'adhésion à LA CITADELLE a été envoyée avec succès.
            </p>
            <p className="mb-4 text-sm md:text-base">
              Nous examinerons votre demande dans les plus brefs délais et vous contacterons par email.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button onClick={handleBackToHome} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-sm md:text-base py-2 px-4 h-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col items-center p-2 md:p-4">
      <div className="w-full max-w-4xl">
        <Button 
          variant="outline" 
          className="mb-4 bg-white text-sm py-1 px-2 h-auto md:py-2 md:px-4" 
          onClick={handleBackToHome}
        >
          <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          <span className="text-sm">Retour</span>
        </Button>
        
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b pb-2 md:pb-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1 md:mb-2">
              <div className="text-xs md:text-sm mb-2 md:mb-0">
                <p>LA CITADELLE (Ex CDA)</p>
                <p>07 08 10 50 05 - 07 07 08 06 10</p>
                <p>mail: club.lacitadelle@gmail.com</p>
              </div>
              <div className="flex justify-center md:flex-shrink-0">
                <img 
                  src="/lovable-uploads/958417a8-6efc-40bd-865c-03214b65b4a2.png" 
                  alt="LA CITADELLE" 
                  className="h-12 md:h-16 w-auto"
                />
              </div>
            </div>
            <CardTitle className="text-lg md:text-xl mt-1 md:mt-2">Fiche de demande d'adhésion Individuelle</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
            {/* Message d'erreur */}
            {errorMessage && (
              <Alert variant="destructive" className="mb-4 md:mb-6 text-sm md:text-base">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur lors de la soumission</AlertTitle>
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Information sur les objectifs - Simplifié sur mobile */}
            <div className={`${sectionStyle} mb-4 md:mb-8 bg-amber-50 text-xs md:text-sm`}>
              <h3 className={`${sectionTitleStyle} font-bold text-sm md:text-base`}>Objectifs et Conditions</h3>
              <p className="mb-1 md:mb-2 mt-2">
                <span className="font-bold">LA CITADELLE</span> a pour <span className="font-bold">objectif principal</span> de réunir les cadres musulmans pour participer aux activités de la communauté et à l'essor de la NATION: "S'UNIR POUR SERVIR". 
              </p>
              <p className="mb-1 md:mb-2">
                <span className="font-bold">L'adhésion est ouverte:</span>
              </p>
              <ul className="list-disc pl-4 md:pl-6 space-y-0.5 md:space-y-1 mb-1 md:mb-2">
                <li>aux cadres musulmans de l'administration</li>
                <li>aux cadres musulmans du secteur privé</li>
                <li>à la diaspora ou artisans, capables de cotiser au moins 100 000 FCFA par an</li>
              </ul>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 md:space-y-6">
                {/* Section Identité */}
                <div className={sectionStyle}>
                  <h3 className={sectionTitleStyle}>Identité</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">Nom</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Votre nom" 
                              {...field} 
                              className="h-10 md:h-11 text-base md:text-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">Prénom</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Votre prénom" 
                              {...field} 
                              className="h-10 md:h-11 text-base md:text-sm" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">Profession</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Votre profession actuelle" 
                              {...field} 
                              className="h-10 md:h-11 text-base md:text-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contact_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">Contact</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0X XX XX XX XX" 
                              {...field} 
                              className="h-10 md:h-11 text-base md:text-sm"
                              type="tel"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">Adresse</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Votre adresse" 
                              {...field} 
                              className="h-10 md:h-11 text-base md:text-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="votre.email@exemple.com" 
                              type="email" 
                              {...field} 
                              className="h-10 md:h-11 text-base md:text-sm"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Section Souscription */}
                <div className={sectionStyle}>
                  <h3 className={sectionTitleStyle}>Souscription</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
                    <FormField
                      control={form.control}
                      name="subscription_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">Montant annuel</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="100000" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? 100000 : Number(e.target.value))}
                              className="h-10 md:h-11 text-base md:text-sm"
                              inputMode="numeric"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subscription_start_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">À compter du mois de</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 md:h-11 text-base md:text-sm">
                                <SelectValue placeholder="Sélectionnez un mois" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="text-base md:text-sm">
                              <SelectItem value="janvier">Janvier</SelectItem>
                              <SelectItem value="fevrier">Février</SelectItem>
                              <SelectItem value="mars">Mars</SelectItem>
                              <SelectItem value="avril">Avril</SelectItem>
                              <SelectItem value="mai">Mai</SelectItem>
                              <SelectItem value="juin">Juin</SelectItem>
                              <SelectItem value="juillet">Juillet</SelectItem>
                              <SelectItem value="aout">Août</SelectItem>
                              <SelectItem value="septembre">Septembre</SelectItem>
                              <SelectItem value="octobre">Octobre</SelectItem>
                              <SelectItem value="novembre">Novembre</SelectItem>
                              <SelectItem value="decembre">Décembre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Résumé des calculs - Adapté pour mobile */}
                  <div className="bg-amber-100 p-3 md:p-4 rounded-md mt-3 md:mt-4 mb-3 md:mb-4">
                    <h4 className="font-medium flex items-center mb-2 text-sm md:text-base">
                      <LucideCalculator className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Résumé de votre souscription
                    </h4>
                    <div className="grid grid-cols-2 gap-1 md:gap-2 text-xs md:text-sm">
                      <p>Montant annuel total:</p>
                      <p className="font-bold text-right">{(form.getValues('subscription_amount') || 100000).toLocaleString()} FCFA</p>
                      
                      <p>Périodicité de paiement:</p>
                      <p className="font-bold text-right">{form.watch('payment_frequency')}</p>
                      
                      <p>Montant par période:</p>
                      <p className="font-bold text-right">{periodicAmount.toLocaleString()} FCFA</p>
                      
                      {form.watch('subscription_start_month') && (
                        <>
                          <p>Montant à payer cette année:</p>
                          <p className="font-bold text-right">{remainingAmount.toLocaleString()} FCFA</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Mode de Règlement - Optimisé pour mobile */}
                  <div className="mt-3 md:mt-4">
                    <div className="mb-2">
                      <FormLabel className="text-sm md:text-base">Mode de Règlement</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                id="especes"
                                value="especes"
                                checked={field.value === "especes"}
                                onChange={() => field.onChange("especes")}
                                className="form-radio h-4 w-4 text-amber-600"
                              />
                            </FormControl>
                            <FormLabel htmlFor="especes" className="cursor-pointer text-xs md:text-sm">Espèces</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                id="cheque"
                                value="cheque"
                                checked={field.value === "cheque"}
                                onChange={() => field.onChange("cheque")}
                                className="form-radio h-4 w-4 text-amber-600"
                              />
                            </FormControl>
                            <FormLabel htmlFor="cheque" className="cursor-pointer text-xs md:text-sm">Chèque</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                id="virement"
                                value="virement"
                                checked={field.value === "virement"}
                                onChange={() => field.onChange("virement")}
                                className="form-radio h-4 w-4 text-amber-600"
                              />
                            </FormControl>
                            <FormLabel htmlFor="virement" className="cursor-pointer text-xs md:text-sm">Virement bancaire</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                id="mobile_money"
                                value="mobile_money"
                                checked={field.value === "mobile_money"}
                                onChange={() => field.onChange("mobile_money")}
                                className="form-radio h-4 w-4 text-amber-600"
                              />
                            </FormControl>
                            <FormLabel htmlFor="mobile_money" className="cursor-pointer text-xs md:text-sm">Mobile Money</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Périodicité - Optimisé pour mobile */}
                  <div className="mt-3 md:mt-4">
                    <div className="mb-2">
                      <FormLabel className="text-sm md:text-base">Périodicité</FormLabel>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      <FormField
                        control={form.control}
                        name="payment_frequency"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                id="mensuelle"
                                value="mensuelle"
                                checked={field.value === "mensuelle"}
                                onChange={() => field.onChange("mensuelle")}
                                className="form-radio h-4 w-4 text-amber-600"
                              />
                            </FormControl>
                            <FormLabel htmlFor="mensuelle" className="cursor-pointer text-xs md:text-sm">Mensuelle</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="payment_frequency"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                id="trimestrielle"
                                value="trimestrielle"
                                checked={field.value === "trimestrielle"}
                                onChange={() => field.onChange("trimestrielle")}
                                className="form-radio h-4 w-4 text-amber-600"
                              />
                            </FormControl>
                            <FormLabel htmlFor="trimestrielle" className="cursor-pointer text-xs md:text-sm">Trimestrielle</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="payment_frequency"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="radio"
                                id="annuelle"
                                value="annuelle"
                                checked={field.value === "annuelle"}
                                onChange={() => field.onChange("annuelle")}
                                className="form-radio h-4 w-4 text-amber-600"
                              />
                            </FormControl>
                            <FormLabel htmlFor="annuelle" className="cursor-pointer text-xs md:text-sm">Annuelle</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Section Domaines de compétence */}
                <div className={sectionStyle}>
                  <h3 className={sectionTitleStyle}>Vos Domaines de Compétence</h3>
                  
                  <FormField
                    control={form.control}
                    name="competence_domains"
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormControl>
                          <Textarea 
                            placeholder="Décrivez vos domaines de compétence" 
                            className="min-h-[80px] md:min-h-[100px] text-base md:text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section Attentes */}
                <div className={sectionStyle}>
                  <h3 className={sectionTitleStyle}>Vos attentes vis-à-vis du Club</h3>
                  
                  <div className="grid grid-cols-2 gap-2 md:gap-4 mt-2">
                    {CLUB_EXPECTATIONS.map((expectation)
