
// Formulaire d'adhésion pour les participants
// Mis à jour pour utiliser la nouvelle table memberships
import React, { useState } from 'react';
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
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Schéma de validation mis à jour pour le formulaire d'adhésion
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
  payment_method: z.enum(['especes', 'cheque', 'virement'], { 
    message: 'Veuillez sélectionner un mode de règlement valide' 
  }),
  
  // Périodicité
  payment_frequency: z.enum(['mensuelle', 'trimestrielle', 'annuelle'], { 
    message: 'Veuillez sélectionner une périodicité valide' 
  }),
  
  // Domaines de compétence et attentes
  competence_domains: z.string().optional(),
  club_expectations: z.string().optional(),
  other_expectations: z.string().optional(),
  
  // Accord des conditions
  agree_terms: z.boolean().refine(val => val === true, { 
    message: 'Vous devez accepter les conditions' 
  })
});

type MembershipFormValues = z.infer<typeof membershipFormSchema>;

const MembershipForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
      club_expectations: '',
      other_expectations: '',
      agree_terms: false
    }
  });

  const handleSubmit = async (values: MembershipFormValues) => {
    setIsSubmitting(true);
    try {
      // Vérifier si l'email existe déjà dans la base de données des adhésions
      const { data: existingMemberships, error: checkError } = await supabase
        .from('memberships')
        .select('id, status')
        .eq('email', values.email);
      
      if (checkError) throw checkError;
      
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

      // Formatter les attentes comme un tableau pour la base de données
      const clubExpectationsArray = values.club_expectations ? 
        [values.club_expectations] : [];

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
      
      if (insertError) throw insertError;
      
      // Vérifier si un participant avec cet email existe déjà
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('email', values.email)
        .maybeSingle();
      
      let participantId = existingParticipant?.id;
      
      // Si le participant n'existe pas, le créer
      if (!participantId) {
        const { data: newParticipant, error: participantError } = await supabase
          .from('participants')
          .insert({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            contact_number: values.contact_number,
            is_member: false
          })
          .select()
          .single();
        
        if (participantError) throw participantError;
        
        participantId = newParticipant.id;
      }
      
      // Mettre à jour l'adhésion avec l'id du participant
      if (participantId) {
        await supabase
          .from('memberships')
          .update({ participant_id: participantId })
          .eq('id', newMembership.id);
      }
      
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-green-600">Demande envoyée avec succès</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center my-6">
              <UserPlus className="h-20 w-20 text-green-500" />
            </div>
            <p className="mb-4">
              Votre demande d'adhésion à LA CITADELLE a été envoyée avec succès.
            </p>
            <p className="mb-4">
              Nous examinerons votre demande dans les plus brefs délais et vous contacterons par email.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleBackToHome}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={handleBackToHome}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Demande d'adhésion à LA CITADELLE</CardTitle>
            <CardDescription className="text-center">
              Rejoignez notre association et participez à nos activités et événements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Section Identité */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Identité</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <FormField
                      control={form.control}
                      name="contact_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="0X XX XX XX XX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse (optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre adresse" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Section Souscription */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Souscription</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subscription_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant de la souscription (FCFA)</FormLabel>
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
                          <FormLabel>Mois de début (optionnel)</FormLabel>
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
                </div>
                
                {/* Section Mode de règlement */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Mode de règlement</h3>
                  
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Choisissez un mode de règlement</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="especes" id="especes" />
                              <Label htmlFor="especes">Espèces</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cheque" id="cheque" />
                              <Label htmlFor="cheque">Chèque</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="virement" id="virement" />
                              <Label htmlFor="virement">Virement</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section Périodicité */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Périodicité</h3>
                  
                  <FormField
                    control={form.control}
                    name="payment_frequency"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Choisissez une périodicité</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="mensuelle" id="mensuelle" />
                              <Label htmlFor="mensuelle">Mensuelle</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="trimestrielle" id="trimestrielle" />
                              <Label htmlFor="trimestrielle">Trimestrielle</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="annuelle" id="annuelle" />
                              <Label htmlFor="annuelle">Annuelle</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section Domaines de compétence */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Domaines de compétence</h3>
                  
                  <FormField
                    control={form.control}
                    name="competence_domains"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vos domaines de compétence (optionnel)</FormLabel>
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
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Attentes vis-à-vis du Club</h3>
                  
                  <FormField
                    control={form.control}
                    name="club_expectations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vos attentes (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Quelles sont vos attentes vis-à-vis du Club?" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="other_expectations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autres attentes (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Avez-vous d'autres attentes ou commentaires?" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section Conditions */}
                <FormField
                  control={form.control}
                  name="agree_terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
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
                  className="w-full"
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
