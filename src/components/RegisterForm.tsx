
// Ce fichier contient le formulaire d'inscription pour les participants
// Modifications:
// - Mise à jour de la vérification des emails existants pour considérer aussi les noms/prénoms
// - Nouvelle logique de vérification compatible avec la contrainte d'unicité email+nom+prénom
// - Meilleurs messages d'erreur pour guider l'utilisateur

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Check, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import EventLogo from "./EventLogo";

// Définition du schéma de validation amélioré pour accepter tous types d'emails
const formSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
  lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  contactNumber: z
    .string()
    .regex(/^\+225[0-9]{10}$/, { 
      message: "Le numéro doit être au format +225 suivi de 10 chiffres exactement" 
    }),
  email: z.string()
    .min(1, { message: "L'email est requis" })
    .trim() // Nettoyer automatiquement les espaces avant validation
    .email({ 
      message: "Format d'email invalide. Exemple valide: nom@exemple.com" 
    })
    .refine(email => {
      // Log pour débogage
      console.log("Validating email in form:", email);
      
      // Email regex plus permissive pour accepter tous les services d'email
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = emailRegex.test(email);
      
      // Log du résultat
      console.log("Email validation result in form:", isValid);
      
      return isValid;
    }, {
      message: "L'email contient des caractères non autorisés ou un format incorrect"
    }),
  isMember: z.boolean().default(false),
});

// Type pour les données du formulaire basé sur le schéma
type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const navigate = useNavigate();

  // Initialisation du formulaire avec react-hook-form et le resolver zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      contactNumber: "+225",
      email: "",
      isMember: false,
    },
    mode: "onBlur", // Changer à onBlur pour éviter trop de validations pendant la saisie
  });
  
  // Surveiller les erreurs d'email pour le débogage
  useEffect(() => {
    const emailError = form.formState.errors.email;
    if (emailError) {
      console.log("Email error:", emailError);
    }
  }, [form.formState.errors.email]);

  // Vérifier si l'email existe déjà avec le même nom et prénom dans la base de données
  const checkEmailExists = async (email: string) => {
    if (!email || form.formState.errors.email) return;
    
    const firstName = form.getValues('firstName');
    const lastName = form.getValues('lastName');
    
    // Ne pas vérifier si le nom ou prénom est vide
    if (!firstName || !lastName) return;
    
    setIsCheckingEmail(true);
    try {
      console.log("Vérification si l'email existe déjà avec ce nom et prénom:", email, firstName, lastName);
      
      const { data, error, count } = await supabase
        .from('participants')
        .select('id', { count: 'exact' })
        .eq('email', email)
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .limit(1);
      
      if (error) {
        console.error("Erreur lors de la vérification de l'email:", error);
        throw error;
      }
      
      const exists = (count && count > 0) || (data && data.length > 0);
      console.log("Email avec ce nom et prénom existe déjà:", exists);
      setEmailExists(exists);
      
      if (exists) {
        form.setError('email', { 
          type: 'manual', 
          message: "Cette personne est déjà inscrite à l'événement avec cet email." 
        });
      } else {
        form.clearErrors('email');
      }
      
      return exists;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'email:", error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Vérifier l'email lorsque l'email, le prénom ou le nom change
  useEffect(() => {
    const email = form.getValues('email');
    const firstName = form.getValues('firstName');
    const lastName = form.getValues('lastName');
    
    if (email && firstName && lastName && !form.formState.errors.email) {
      const timeoutId = setTimeout(() => {
        checkEmailExists(email);
      }, 500); // Délai pour éviter trop d'appels à l'API
      
      return () => clearTimeout(timeoutId);
    }
  }, [form.watch('email'), form.watch('firstName'), form.watch('lastName')]);

  // Fonction pour gérer la soumission du formulaire
  async function onSubmit(data: FormValues) {
    // Double vérification pour éviter les soumissions multiples
    if (isSubmitting) return;
    
    // Incrémenter le compteur de soumission pour traquer les tentatives multiples
    setSubmissionCount(prev => prev + 1);
    console.log(`Tentative de soumission #${submissionCount + 1}`);
    
    try {
      // Vérifier une dernière fois si l'email existe avec ce nom et prénom
      const emailAlreadyExists = await checkEmailExists(data.email);
      if (emailAlreadyExists) {
        toast({
          title: "Inscription impossible",
          description: "Cette personne est déjà inscrite à l'événement avec cet email.",
          variant: "destructive",
        });
        return;
      }
      
      // Nettoyer l'email une dernière fois avant soumission
      const cleanedEmail = data.email.trim();
      console.log("Submitting form with data:", {...data, email: cleanedEmail});
      setIsSubmitting(true);
      
      // Sauvegarde des données dans Supabase
      const { data: participant, error } = await supabase
        .from('participants')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          contact_number: data.contactNumber,
          email: cleanedEmail, // Utiliser l'email nettoyé
          is_member: data.isMember,
        })
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        
        // Gestion spécifique des erreurs de contrainte d'unicité
        if (error.code === '23505') {
          toast({
            title: "Inscription impossible",
            description: "Cette personne est déjà inscrite à l'événement avec cet email.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      console.log("Participant créé avec succès:", participant);
      console.log("ID du participant:", participant.id);

      // Afficher notification de succès
      toast({
        title: "Inscription réussie",
        description: "Vos informations ont été enregistrées avec succès. Vous allez être redirigé vers la page de paiement.",
      });
      
      // Réinitialiser le formulaire après la soumission
      form.reset();
      
      // Redirection vers la page de paiement avec un délai court
      console.log("Redirection vers /payment/" + participant.id);
      setTimeout(() => {
        navigate(`/payment/${participant.id}`);
      }, 500);
      
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'enregistrement de vos informations.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Gérer le format du numéro de téléphone avec plus de précision
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // S'assurer que le préfixe +225 est toujours présent
    if (!value.startsWith("+225")) {
      value = "+225";
    }
    
    // Extraire uniquement les chiffres après le +225
    const prefix = "+225";
    const afterPrefix = value.substring(prefix.length).replace(/\D/g, "");
    
    // Limiter à exactement 10 chiffres après le préfixe
    const cleanDigits = afterPrefix.substring(0, 10);
    
    // Reconstruire le numéro avec le préfixe
    const formattedNumber = `${prefix}${cleanDigits}`;
    
    // Mettre à jour le formulaire
    form.setValue("contactNumber", formattedNumber);
    
    // Log pour debug
    console.log("Numéro formaté:", formattedNumber);
  };

  // Fonction pour nettoyer l'email des espaces et caractères spéciaux
  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value.trim();
    console.log("Email input cleaned:", emailValue);
    form.setValue("email", emailValue);
  };

  // Déterminer l'état du bouton de soumission
  const isButtonDisabled = isSubmitting || isCheckingEmail || emailExists;

  return (
    <Card className="w-full max-w-md mx-auto border-green-100 shadow-md">
      <CardHeader className="space-y-1 bg-green-50 rounded-t-lg">
        <CardTitle className="text-2xl font-bold text-center text-green-700">Inscription à l'événement</CardTitle>
        <CardDescription className="text-center text-green-600">Veuillez remplir tous les champs pour vous inscrire</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Prénom</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 h-4 w-4" />
                        <Input className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400" placeholder="Votre prénom" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Nom</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 h-4 w-4" />
                        <Input className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400" placeholder="Votre nom" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Numéro de contact</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 h-4 w-4" />
                      <Input 
                        className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400" 
                        placeholder="+225" 
                        {...field} 
                        onChange={handlePhoneInput}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="text-xs text-gray-500">
                    Format: +225 suivi de 10 chiffres
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 h-4 w-4" />
                      <div className="relative">
                        <Input 
                          className={`pl-10 border-green-200 focus:border-green-400 focus:ring-green-400 ${emailExists ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''}`}
                          placeholder="votre.email@exemple.com" 
                          {...field} 
                          onBlur={(e) => {
                            handleEmailInput(e);
                            field.onBlur();
                          }}
                        />
                        {isCheckingEmail && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="text-xs text-gray-500">
                    {emailExists 
                      ? "Cette personne est déjà inscrite avec cet email et ce nom." 
                      : "Vous pouvez utiliser le même email pour plusieurs personnes avec des noms différents."}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isMember"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-green-100 p-4 bg-green-50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-green-400 text-green-700"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-gray-700">Membre de la Citadelle</FormLabel>
                    <FormDescription className="text-green-600">
                      Cochez cette case si vous êtes membre de la Citadelle
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
              disabled={isButtonDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : isCheckingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification de l'email...
                </>
              ) : emailExists ? (
                "Email déjà inscrit avec ce nom"
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-green-100 pt-4">
        <EventLogo size="small" />
      </CardFooter>
    </Card>
  );
}
