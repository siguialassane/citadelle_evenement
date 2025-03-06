
// Ce fichier contient le formulaire d'inscription pour les participants
// Modifications:
// - Format plus flexible pour le numéro de téléphone
// - Amélioration du formatage automatique du numéro

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

// Définition du schéma de validation
const formSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
  lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  contactNumber: z
    .string()
    .regex(/^\+225[ ]?[0-9]{8,10}$/, { 
      message: "Le numéro doit commencer par +225 suivi de 8 à 10 chiffres" 
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
      contactNumber: "+225 ",
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

  // Gérer le format du numéro de téléphone
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // S'assurer que le préfixe +225 est toujours présent
    if (!value.startsWith("+225")) {
      value = "+225 ";
    } else {
      // Extraire tous les chiffres après le code pays
      const digits = value.replace(/\D/g, "").substring(3);
      // Limiter à 10 chiffres maximum et reformater
      value = `+225 ${digits.substring(0, 10)}`;
    }
    
    form.setValue("contactNumber", value);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Inscription à l'événement</CardTitle>
        <CardDescription className="text-center">Veuillez remplir tous les champs pour vous inscrire</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input className="pl-10" placeholder="Votre prénom" {...field} />
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
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input className="pl-10" placeholder="Votre nom" {...field} />
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
                  <FormLabel>Numéro de contact</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input 
                        className="pl-10" 
                        placeholder="+225 0000000000" 
                        {...field} 
                        onChange={handlePhoneInput}
                      />
                    </div>
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
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input className="pl-10" placeholder="votre.email@exemple.com" {...field} />
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Membre de la Citadelle</FormLabel>
                    <FormDescription>
                      Cochez cette case si vous êtes membre de la Citadelle
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
