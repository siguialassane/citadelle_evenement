// Ce fichier contient le formulaire d'inscription pour les participants
// Modifications:
// - Correction du format du numéro de téléphone pour imposer exactement 10 chiffres après +225

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import EventLogo from "./EventLogo";

// Définition du schéma de validation amélioré
const formSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
  lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  contactNumber: z
    .string()
    .regex(/^\+225[0-9]{10}$/, { 
      message: "Le numéro doit être au format +225 suivi de 10 chiffres exactement" 
    }),
  email: z.string().email({ message: "Adresse email invalide" }),
  isMember: z.boolean().default(false),
});

// Type pour les données du formulaire basé sur le schéma
type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });

  // Fonction pour gérer la soumission du formulaire
  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true);
      
      // Sauvegarde des données dans Supabase
      const { data: participant, error } = await supabase
        .from('participants')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          contact_number: data.contactNumber,
          email: data.email,
          is_member: data.isMember,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }

      // Afficher notification de succès
      toast({
        title: "Inscription réussie",
        description: "Vos informations ont été enregistrées avec succès. Vous allez être redirigé vers la page de paiement.",
      });
      
      // Réinitialiser le formulaire après la soumission
      form.reset();
      
      // Redirection vers la page de paiement
      navigate(`/payment/${participant.id}`);
      
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
                      <Input className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400" placeholder="votre.email@exemple.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
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
