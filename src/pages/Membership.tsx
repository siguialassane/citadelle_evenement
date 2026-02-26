// Formulaire d'adhésion pour les participants
// Mise à jour:
// - Transformation en formulaire multi-étapes (onglets)
// - Ajout d'animations fluides avec framer-motion
// - Validation étape par étape

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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, ArrowLeft, ArrowRight, LucideCalculator, AlertCircle, CheckCircle2, User, CreditCard, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CLUB_EXPECTATIONS } from '@/components/manual-payment/services/emails/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

// Schémas de validation par étape
const step1Schema = z.object({
  first_name: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
  last_name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Email invalide' }),
  contact_number: z.string().min(8, { message: 'Numéro de téléphone invalide' }),
  profession: z.string().min(2, { message: 'Veuillez indiquer votre profession' }),
  address: z.string().optional(),
});

const step2Schema = z.object({
  subscription_amount: z.preprocess(
    (val) => (val === '' ? 100000 : Number(val)), 
    z.number().min(1, { message: 'Le montant doit être supérieur à 0' })
  ),
  subscription_start_month: z.string().optional(),
  payment_method: z.enum(['especes', 'cheque', 'virement', 'mobile_money'], { 
    message: 'Veuillez sélectionner un mode de règlement valide' 
  }),
  payment_frequency: z.enum(['mensuelle', 'trimestrielle', 'annuelle'], { 
    message: 'Veuillez sélectionner une périodicité valide' 
  }),
});

const step3Schema = z.object({
  competence_domains: z.string().optional(),
  formation: z.boolean().default(false),
  loisirs: z.boolean().default(false),
  echanges: z.boolean().default(false),
  reseau: z.boolean().default(false),
  other_expectations: z.string().optional(),
  agree_terms: z.boolean().refine(val => val === true, { 
    message: 'Vous devez accepter les conditions' 
  })
});

// Schéma global combiné
const membershipFormSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type MembershipFormValues = z.infer<typeof membershipFormSchema>;

// Fonctions utilitaires
const calculatePeriodicAmount = (totalAmount: number, frequency: string): number => {
  switch (frequency) {
    case 'mensuelle': return Math.round(totalAmount / 12);
    case 'trimestrielle': return Math.round(totalAmount / 4);
    case 'annuelle': return totalAmount;
    default: return totalAmount;
  }
};

const getRemainingMonths = (startMonth: string): number => {
  if (!startMonth) return 12;
  const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
  const startIndex = months.indexOf(startMonth);
  return startIndex === -1 ? 12 : 12 - startIndex;
};

const MembershipForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 pour avancer, -1 pour reculer
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
      first_name: '', last_name: '', email: '', contact_number: '', profession: '', address: '',
      subscription_amount: 100000, subscription_start_month: '', payment_method: 'especes', payment_frequency: 'mensuelle',
      competence_domains: '', formation: false, loisirs: false, echanges: false, reseau: false, other_expectations: '', agree_terms: false
    },
    mode: "onChange"
  });

  // Mise à jour des calculs
  useEffect(() => {
    const totalAmount = form.getValues('subscription_amount') || 100000;
    const frequency = form.getValues('payment_frequency') || 'mensuelle';
    const startMonth = form.getValues('subscription_start_month') || '';
    
    setPeriodicAmount(calculatePeriodicAmount(totalAmount, frequency));
    setRemainingAmount(Math.round(totalAmount * (getRemainingMonths(startMonth) / 12)));
  }, [form.watch('subscription_amount'), form.watch('payment_frequency'), form.watch('subscription_start_month')]);

  // Navigation entre les étapes
  const nextStep = async () => {
    let schemaToValidate;
    let fieldsToValidate: any[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['first_name', 'last_name', 'email', 'contact_number', 'profession', 'address'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['subscription_amount', 'subscription_start_month', 'payment_method', 'payment_frequency'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (values: MembershipFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const clubExpectationsArray: string[] = [];
      if (values.formation) clubExpectationsArray.push("Formation");
      if (values.loisirs) clubExpectationsArray.push("Loisirs");
      if (values.echanges) clubExpectationsArray.push("Échanges et débats");
      if (values.reseau) clubExpectationsArray.push("Appartenir à un réseau");

      const { data: newMembership, error: insertError } = await supabase
        .from('memberships')
        .insert({
          first_name: values.first_name, last_name: values.last_name, email: values.email,
          contact_number: values.contact_number, profession: values.profession, address: values.address || null,
          subscription_amount: values.subscription_amount, subscription_start_month: values.subscription_start_month || null,
          payment_method: values.payment_method, payment_frequency: values.payment_frequency,
          competence_domains: values.competence_domains || null, club_expectations: clubExpectationsArray,
          other_expectations: values.other_expectations || null, status: 'pending', requested_at: new Date().toISOString()
        })
        .select().single();
      
      if (insertError) throw insertError;
      
      const { data: existingParticipant } = await supabase
        .from('participants').select('id').eq('email', values.email).maybeSingle();
      
      if (existingParticipant?.id) {
        await supabase.from('memberships').update({ participant_id: existingParticipant.id }).eq('id', newMembership.id);
      }
      
      await sendMembershipRequestAdminEmail({ ...newMembership, id: existingParticipant?.id || newMembership.id });
      await sendMembershipRequestParticipantEmail({ ...newMembership, id: existingParticipant?.id || newMembership.id });
      
      setIsSuccess(true);
      toast({ title: "Demande envoyée", description: "Votre demande d'adhésion a été envoyée avec succès." });
      
    } catch (error: any) {
      setErrorMessage(error.message || "Une erreur est survenue.");
      toast({ title: "Erreur", description: errorMessage || "Erreur lors de la soumission", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Configuration des animations Framer Motion
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const steps = [
    { id: 1, title: "Identité", icon: <User className="w-5 h-5" /> },
    { id: 2, title: "Souscription", icon: <CreditCard className="w-5 h-5" /> },
    { id: 3, title: "Attentes", icon: <Target className="w-5 h-5" /> }
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-lg shadow-xl border-none overflow-hidden">
          <CardHeader className="text-center bg-emerald-900 text-white rounded-t-xl pb-8 pt-8">
            <CardTitle className="text-center text-2xl md:text-3xl font-bold">Demande envoyée avec succès</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-8 px-8">
            <div className="flex justify-center mb-8 -mt-16">
              <div className="bg-white p-4 rounded-full shadow-lg">
                <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-emerald-500" />
              </div>
            </div>
            <p className="mb-4 text-slate-700 text-lg">
              Votre demande d'adhésion à <strong className="text-emerald-800">LA CITADELLE</strong> a été envoyée avec succès.
            </p>
            <p className="mb-6 text-slate-600">
              Nous examinerons votre demande dans les plus brefs délais et vous contacterons par email.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-8 bg-slate-50">
            <Button onClick={() => navigate('/')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-6 px-8 rounded-xl shadow-md transition-all hover:shadow-lg text-base">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative font-sans overflow-x-hidden">
      {/* Bande décorative */}
      <div className="fixed top-0 left-0 w-full h-1.5 flex z-50">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-emerald-600 w-1/3 h-full"></div>
      </div>

      {/* Hero Section */}
      <div className="bg-emerald-900 text-white pt-16 pb-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Button variant="ghost" className="absolute left-0 top-0 text-emerald-100 hover:text-white hover:bg-emerald-800" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="inline-block mb-6 mt-8 sm:mt-0">
            <img src="/lovable-uploads/958417a8-6efc-40bd-865c-03214b65b4a2.png" alt="LA CITADELLE" className="h-20 md:h-24 w-auto bg-white p-2 rounded-xl shadow-lg" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="block text-emerald-50 mb-2">Rejoignez</span>
            <span className="block text-amber-500 font-serif italic">LA CITADELLE</span>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <Card className="shadow-xl border-none rounded-2xl overflow-hidden bg-white">
          
          {/* Stepper Header */}
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 md:p-6">
            <div className="flex justify-between items-center relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-emerald-200 z-0"></div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-emerald-600 z-0 transition-all duration-500" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
              
              {steps.map((step) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-300 ${
                    currentStep >= step.id ? 'bg-emerald-600 border-emerald-100 text-white' : 'bg-white border-emerald-100 text-emerald-300'
                  }`}>
                    {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.icon}
                  </div>
                  <span className={`mt-2 text-xs md:text-sm font-bold ${currentStep >= step.id ? 'text-emerald-800' : 'text-emerald-400'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="pt-8 px-4 md:px-8 pb-8 overflow-hidden">
            {errorMessage && (
              <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="font-bold">Erreur</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <AnimatePresence mode="wait" custom={direction}>
                  
                  {/* ETAPE 1 : IDENTITE */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-emerald-900">Vos informations personnelles</h2>
                        <p className="text-slate-500 mt-2">Parlez-nous un peu de vous.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="last_name" render={({ field }) => (
                          <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Votre nom" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="first_name" render={({ field }) => (
                          <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Votre prénom" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="profession" render={({ field }) => (
                          <FormItem><FormLabel>Profession</FormLabel><FormControl><Input placeholder="Votre profession" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="contact_number" render={({ field }) => (
                          <FormItem><FormLabel>Contact</FormLabel><FormControl><Input placeholder="0X XX XX XX XX" type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="votre.email@exemple.com" type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                          <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="Votre adresse" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </motion.div>
                  )}

                  {/* ETAPE 2 : SOUSCRIPTION */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-emerald-900">Détails de la souscription</h2>
                        <p className="text-slate-500 mt-2">Configurez votre cotisation annuelle.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="subscription_amount" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant annuel (FCFA)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100000" {...field} onChange={(e) => field.onChange(e.target.value === '' ? 100000 : Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="subscription_start_month" render={({ field }) => (
                          <FormItem>
                            <FormLabel>À compter du mois de</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un mois" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'].map(m => (
                                  <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                        <h4 className="font-bold text-emerald-800 flex items-center mb-3"><LucideCalculator className="w-4 h-4 mr-2" /> Résumé</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                          <p>Montant annuel:</p><p className="font-bold text-right">{(form.getValues('subscription_amount') || 100000).toLocaleString()} FCFA</p>
                          <p>Par période:</p><p className="font-bold text-right text-amber-600">{periodicAmount.toLocaleString()} FCFA</p>
                          {form.watch('subscription_start_month') && (
                            <><p>À payer cette année:</p><p className="font-bold text-right">{remainingAmount.toLocaleString()} FCFA</p></>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <FormLabel className="text-base font-bold text-slate-800">Mode de Règlement</FormLabel>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {['especes', 'cheque', 'virement', 'mobile_money'].map((method) => (
                              <FormField key={method} control={form.control} name="payment_method" render={({ field }) => (
                                <FormItem className={`flex items-center space-x-3 space-y-0 border p-3 rounded-lg cursor-pointer transition-colors ${field.value === method ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                  <FormControl><input type="radio" value={method} checked={field.value === method} onChange={() => field.onChange(method)} className="form-radio h-4 w-4 text-emerald-600" /></FormControl>
                                  <FormLabel className="cursor-pointer font-normal capitalize">{method.replace('_', ' ')}</FormLabel>
                                </FormItem>
                              )} />
                            ))}
                          </div>
                        </div>

                        <div>
                          <FormLabel className="text-base font-bold text-slate-800">Périodicité</FormLabel>
                          <div className="grid grid-cols-3 gap-3 mt-2">
                            {['mensuelle', 'trimestrielle', 'annuelle'].map((freq) => (
                              <FormField key={freq} control={form.control} name="payment_frequency" render={({ field }) => (
                                <FormItem className={`flex items-center justify-center space-x-2 space-y-0 border p-3 rounded-lg cursor-pointer transition-colors ${field.value === freq ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                  <FormControl><input type="radio" value={freq} checked={field.value === freq} onChange={() => field.onChange(freq)} className="hidden" /></FormControl>
                                  <FormLabel className="cursor-pointer font-medium capitalize text-center w-full">{freq}</FormLabel>
                                </FormItem>
                              )} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ETAPE 3 : ATTENTES & VALIDATION */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-emerald-900">Vos attentes</h2>
                        <p className="text-slate-500 mt-2">Dites-nous ce que vous attendez de LA CITADELLE.</p>
                      </div>

                      <FormField control={form.control} name="competence_domains" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vos Domaines de Compétence</FormLabel>
                          <FormControl><Textarea placeholder="Décrivez vos domaines de compétence" className="min-h-[80px]" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div>
                        <FormLabel className="text-base font-bold text-slate-800 mb-3 block">Vos attentes vis-à-vis du Club</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {CLUB_EXPECTATIONS.map((expectation) => (
                            <FormField key={expectation.id} control={form.control} name={expectation.id as any} render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 border border-slate-200 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" /></FormControl>
                                <FormLabel className="font-normal cursor-pointer w-full">{expectation.label}</FormLabel>
                              </FormItem>
                            )} />
                          ))}
                        </div>
                      </div>

                      <FormField control={form.control} name="other_expectations" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Autres attentes</FormLabel>
                          <FormControl><Textarea placeholder="Décrivez vos autres attentes" className="min-h-[80px]" {...field} /></FormControl>
                        </FormItem>
                      )} />

                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-6">
                        <FormField control={form.control} name="agree_terms" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600" /></FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium text-slate-800 cursor-pointer leading-relaxed">
                                Je déclare avoir pris connaissance des statuts et règlement intérieur de LA CITADELLE et m'engage à les respecter.
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep} 
                    disabled={currentStep === 1 || isSubmitting}
                    className={`px-6 ${currentStep === 1 ? 'invisible' : ''}`}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Précédent
                  </Button>

                  {currentStep < 3 ? (
                    <Button type="button" onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                      Suivant <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white px-8 font-bold shadow-md">
                      {isSubmitting ? "Envoi..." : "Soumettre ma demande"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembershipForm;
