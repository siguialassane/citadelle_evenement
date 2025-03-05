
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone } from "lucide-react";

// Définition du schéma de validation
const formSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
  lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  contactNumber: z
    .string()
    .regex(/^\+225 \d{10}$/, { 
      message: "Le numéro doit être au format +225 suivi de 10 chiffres" 
    }),
  email: z.string().email({ message: "Adresse email invalide" }),
});

// Type pour les données du formulaire basé sur le schéma
type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  // Initialisation du formulaire avec react-hook-form et le resolver zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      contactNumber: "+225 ",
      email: "",
    },
  });

  // Fonction pour gérer la soumission du formulaire
  function onSubmit(data: FormValues) {
    // Pour l'instant, afficher les données soumises dans un toast
    toast({
      title: "Inscription réussie",
      description: (
        <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
    
    // Réinitialiser le formulaire après la soumission
    form.reset();
  }

  // Gérer le format du numéro de téléphone
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // S'assurer que le préfixe +225 est toujours présent
    if (!value.startsWith("+225 ")) {
      value = "+225 ";
    } else {
      // Ne garder que le préfixe et jusqu'à 10 chiffres après
      const digits = value.replace(/\D/g, "").substring(3);
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

            <Button type="submit" className="w-full">S'inscrire</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
