
// Formulaire d'adhésion pour les participants
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

// Schéma de validation pour le formulaire d'adhésion
const membershipFormSchema = z.object({
  first_name: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
  last_name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Email invalide' }),
  contact_number: z.string().min(8, { message: 'Numéro de téléphone invalide' }),
  profession: z.string().min(2, { message: 'Veuillez indiquer votre profession' }),
  motivation: z.string().min(10, { message: 'Veuillez expliquer votre motivation (minimum 10 caractères)' }),
  agree_terms: z.boolean().refine(val => val === true, { message: 'Vous devez accepter les conditions' })
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
      motivation: '',
      agree_terms: false
    }
  });

  const handleSubmit = async (values: MembershipFormValues) => {
    setIsSubmitting(true);
    try {
      // Vérifier si l'email existe déjà dans la base de données
      const { data: existingParticipants, error: checkError } = await supabase
        .from('participants')
        .select('id, membership_status')
        .eq('email', values.email);
      
      if (checkError) throw checkError;
      
      // Si un participant avec cet email existe déjà et a une demande d'adhésion en cours
      if (existingParticipants && existingParticipants.length > 0) {
        const existingRequest = existingParticipants.find(p => p.membership_status === 'pending');
        if (existingRequest) {
          toast({
            title: "Demande déjà en cours",
            description: "Vous avez déjà une demande d'adhésion en cours d'examen.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        const existingMember = existingParticipants.find(p => p.membership_status === 'approved');
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
      
      // Créer un nouvel enregistrement participant pour l'adhésion
      const { data: newParticipant, error: insertError } = await supabase
        .from('participants')
        .insert({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          contact_number: values.contact_number,
          profession: values.profession,
          motivation_text: values.motivation,
          membership_status: 'pending',
          is_member: false,
          membership_requested_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Envoyer des emails de notification
      const adminEmailSent = await sendMembershipRequestAdminEmail(newParticipant);
      const participantEmailSent = await sendMembershipRequestParticipantEmail(newParticipant);
      
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
                  name="motivation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivation</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Pourquoi souhaitez-vous rejoindre LA CITADELLE?" 
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
