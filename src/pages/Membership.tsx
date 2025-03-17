
// Formulaire d'adhésion pour les participants
// Mise à jour:
// - Correction du problème d'envoi du formulaire
// - Amélioration du design avec les couleurs du formulaire d'inscription et le logo
// - Ajout de la logique de calcul pour la souscription
// - Ajout de l'option "Mobile Money" dans les modes de règlement
// - Correction du problème de création de participant lors de l'adhésion

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
import { UserPlus, ArrowLeft, LucideCalculator } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CLUB_EXPECTATIONS, ClubExpectationType } from '@/components/manual-payment/services/emails/types';

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
  const navigate = useNavigate();
  
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

  const handleSubmit = async (values: MembershipFormValues) => {
    console.log("Soumission du formulaire avec les valeurs:", values);
    setIsSubmitting(true);
    try {
      // Vérifier si l'email existe déjà dans la base de données des adhésions
      const { data: existingMemberships, error: checkError } = await supabase
        .from('memberships')
        .select('id, status')
        .eq('email', values.email);
      
      if (checkError) {
        console.error("Erreur lors de la vérification de l'email:", checkError);
        throw checkError;
      }
      
      // Si un membre avec cet email existe déjà et a une demande d'adhésion en cours
      if (existingMemberships && existingMemberships.length > 0) {
        const existingRequest = existingMemberships.find(m => m.status === 'pending');
        if (existingRequest) {
          toast({
            title: "Demande déjà en cours",
            description: "Vous avez déjà une demande d'adhésion en cours d'examen.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        const existingMember = existingMemberships.find(m => m.status === 'approved');
        if (existingMember) {
          toast({
            title: "Déjà membre",
            description: "Vous êtes déjà membre de LA CITADELLE.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

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
      
    } catch (error) {
      console.error("Erreur lors de la soumission de la demande d'adhésion:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission de votre demande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Style commun pour les sections
  const sectionStyle = "border border-gray-300 rounded-md p-4 mb-6";
  const sectionTitleStyle = "text-lg font-medium -mt-7 bg-white px-2 inline-block";

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-2xl">Demande envoyée avec succès</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-6">
            <div className="flex justify-center my-6">
              <UserPlus className="h-20 w-20 text-amber-600" />
            </div>
            <p className="mb-4">
              Votre demande d'adhésion à LA CITADELLE a été envoyée avec succès.
            </p>
            <p className="mb-4">
              Nous examinerons votre demande dans les plus brefs délais et vous contacterons par email.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button onClick={handleBackToHome} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <Button 
          variant="outline" 
          className="mb-4 bg-white" 
          onClick={handleBackToHome}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
        
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b pb-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm">
                <p>LA CITADELLE (Ex CDA)</p>
                <p>07 08 10 50 05 - 07 07 08 06 10</p>
                <p>mail: club.lacitadelle@gmail.com</p>
              </div>
              <div className="flex-shrink-0">
                <img 
                  src="/lovable-uploads/958417a8-6efc-40bd-865c-03214b65b4a2.png" 
                  alt="LA CITADELLE" 
                  className="h-16 w-auto"
                />
              </div>
            </div>
            <CardTitle className="text-xl mt-2">Fiche de demande d'adhésion Individuelle</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Information sur les objectifs */}
            <div className={`${sectionStyle} mb-8 bg-amber-50`}>
              <h3 className={`${sectionTitleStyle} font-bold`}>Objectifs et Conditions</h3>
              <p className="text-sm mb-2">
                <span className="font-bold">LA CITADELLE</span> a pour <span className="font-bold">objectif principal</span> de réunir dans un creuset, les cadres musulmans de l'administration et du secteur privé pour une participation plus active aux activités de la communauté en particulier et en général à l'essor de la NATION d'où son slogan "SUNIR POUR SERVIR". Assister les couches vulnérables et promouvoir l'entraide.
              </p>
              <p className="text-sm mb-2">
                <span className="font-bold">L'adhésion au Club Service LA CITADELLE est ouverte:</span>
              </p>
              <ul className="list-disc pl-6 text-sm mb-2 space-y-1">
                <li>aux cadres musulmans de l'administration publique et para-publique</li>
                <li>aux cadres musulmans du secteur privé ou Chefs d'entreprises</li>
                <li>aux sœurs et frères de la diaspora ou les artisans, capables de cotiser régulièrement au moins 100 000 FCFA par an.</li>
              </ul>
              <p className="text-sm">
                Les adhérents au Club Service s'engagent à respecter les principes de la charte du club et à verser au moins la somme de 100 000 FCFA au titre des cotisations annuelles.
              </p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Section Identité */}
                <div className={sectionStyle}>
                  <h3 className={sectionTitleStyle}>Identité</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre prénom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profession</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre profession actuelle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contact_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="0X XX XX XX XX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse Géographique</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre adresse" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="votre.email@exemple.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Section Souscription */}
                <div className={sectionStyle}>
                  <h3 className={sectionTitleStyle}>Souscription</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subscription_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant de la Souscription annuelle</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="100000" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? 100000 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subscription_start_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>À compter du mois de</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un mois" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Résumé des calculs */}
                  <div className="bg-amber-100 p-4 rounded-md mt-4 mb-4">
                    <h4 className="font-medium flex items-center mb-2">
                      <LucideCalculator className="h-4 w-4 mr-2" />
                      Résumé de votre souscription
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
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
                  
                  <div className="mt-4">
                    <div className="mb-2">
                      <FormLabel>Mode de Règlement</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            <FormLabel htmlFor="especes" className="cursor-pointer">Espèces</FormLabel>
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
                            <FormLabel htmlFor="cheque" className="cursor-pointer">Chèque</FormLabel>
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
                            <FormLabel htmlFor="virement" className="cursor-pointer">Virement bancaire</FormLabel>
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
                            <FormLabel htmlFor="mobile_money" className="cursor-pointer">Mobile Money</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="mb-2">
                      <FormLabel>Périodicité</FormLabel>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
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
                            <FormLabel htmlFor="mensuelle" className="cursor-pointer">Mensuelle</FormLabel>
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
                            <FormLabel htmlFor="trimestrielle" className="cursor-pointer">Trimestrielle</FormLabel>
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
                            <FormLabel htmlFor="annuelle" className="cursor-pointer">Annuelle</FormLabel>
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
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Décrivez vos domaines de compétence" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section Attentes */}
                <div className={sectionStyle}>
                  <h3 className={sectionTitleStyle}>Vos attentes vis-à-vis du Club</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CLUB_EXPECTATIONS.map((expectation) => (
                      <FormField
                        key={expectation.id}
                        control={form.control}
                        name={expectation.id as any}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox 
                                id={expectation.id}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="text-amber-600 border-amber-600"
                              />
                            </FormControl>
                            <FormLabel htmlFor={expectation.id} className="cursor-pointer">
                              {expectation.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="other_expectations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Autres attentes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Précisez vos autres attentes vis-à-vis du Club" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Section Conditions */}
                <FormField
                  control={form.control}
                  name="agree_terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded-md bg-amber-50">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          className="text-amber-600 border-amber-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          J'accepte les conditions d'adhésion et je m'engage à respecter les valeurs de LA CITADELLE
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande d'adhésion"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembershipForm;
