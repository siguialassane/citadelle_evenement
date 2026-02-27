// Ce fichier contient la page principale d'inscription à l'événement
// Modifications:
// - Remplacement des couleurs belges par celles de la Côte d'Ivoire (orange, blanc, vert)
// - Amélioration du design pour correspondre au thème islamique
// - Optimisation pour affichage mobile
// - Mise à jour du programme détaillé selon le nouveau planning
// - Correction de la structure JSX pour n'avoir qu'un seul élément racine

import React from "react";
import { RegisterForm } from "@/components/RegisterForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Calendar, MapPin, Clock, Users, Heart, Book, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EventLogo from "@/components/EventLogo";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative font-sans">
      {/* Bande décorative aux couleurs ivoiriennes en haut de la page */}
      <div className="fixed top-0 left-0 w-full h-1.5 flex z-50">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-emerald-600 w-1/3 h-full"></div>
      </div>

      {/* Hero Section */}
      <div className="bg-emerald-900 text-white pt-16 pb-32 px-4 relative overflow-hidden">
        {/* Motif de fond subtil */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6">
            <EventLogo size="large" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="block text-emerald-50 mb-2">IFTAR 2026</span>
            <span className="block text-amber-500 text-3xl md:text-4xl font-serif italic">15e Édition</span>
          </h1>
          <p className="text-emerald-100 text-lg md:text-xl max-w-2xl mx-auto mt-6">
            Un moment de spiritualité, de partage et de fraternité au cœur du mois béni de Ramadan.
          </p>
        </div>
      </div>

      {/* Floating Info Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Date */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800">Date</h3>
              <p className="text-slate-600 mt-1">Dimanche 8 Mars 2026</p>
            </CardContent>
          </Card>
          
          {/* Card 2: Heure */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800">Heure</h3>
              <p className="text-slate-600 mt-1">De 16h00 à 21h00</p>
            </CardContent>
          </Card>
          
          {/* Card 3: Lieu */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800">Lieu</h3>
              <p className="text-slate-600 mt-1">NOOM Hôtel Plateau</p>
            </CardContent>
          </Card>
          
          {/* Card 4: Pass */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              Solidarité
            </div>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-800">Pass</h3>
              <p className="text-slate-600 mt-1 font-semibold text-lg">30 000 FCFA</p>
            </CardContent>
          </Card>
        </div>

        {/* Charity Banner */}
        <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 shrink-0">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-emerald-800">Action Solidaire</h4>
            <p className="text-emerald-700 text-sm md:text-base">Sur chaque pass, <strong className="text-emerald-900">5 000 FCFA</strong> sont réservés pour offrir 5 repas chauds aux indigents.</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-20">
        
        {/* Conference Highlight */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-emerald-900">La Conférence</h2>
          <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full"></div>
          
          <Card className="mt-8 border-none shadow-md bg-white overflow-hidden text-left">
            <div className="md:flex">
              <div className="bg-emerald-800 md:w-1/3 p-8 flex flex-col justify-center items-center text-white text-center">
                <Book className="h-12 w-12 text-amber-400 mb-4" />
                <h3 className="font-serif text-xl font-medium">Thème Principal</h3>
              </div>
              <div className="p-8 md:w-2/3 flex flex-col justify-center">
                <p className="text-xl md:text-2xl font-semibold text-slate-800 leading-snug">
                  « Le Coran : Parole incréée, source de guidance divine et de repère pour l'humanité »
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Conférencier</p>
                    <p className="font-bold text-emerald-700 text-lg">Imam Cheick Ahmad Tidiane DIABATE</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Timeline Program */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-emerald-900">Programme Détaillé</h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="relative border-l-2 border-emerald-200 ml-4 md:ml-0 md:border-none space-y-8 mt-12">
            {/* Ligne centrale pour desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-200 -ml-[1px]"></div>

            {/* Timeline Item 1 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">16h00</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">16h00</span>
                  <h4 className="font-bold text-slate-800 text-lg">Accueil</h4>
                  <p className="text-slate-600">Accueil et installation des participants</p>
                </div>
              </div>
            </div>
            
            {/* Timeline Item 2 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">16h00 – 16h45</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">16h00 – 16h45</span>
                  <h4 className="font-bold text-slate-800 text-lg">Prières & Zikr</h4>
                  <ul className="text-slate-600 list-disc ml-4 mt-2 space-y-1">
                    <li>Prière de Asr</li>
                    <li>Zikr Collectif – Demande de pardon</li>
                    <li>Lecture de la sourate Yasin (21 Fois)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">16h50 – 18h00</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">16h50 – 18h00</span>
                  <h4 className="font-bold text-slate-800 text-lg">Conférence</h4>
                  <p className="text-slate-600">« Le Coran : Parole incréée, source de guidance divine et de repère pour l'humanité » par l'Imam Cheick Ahmad Tidiane DIABATE</p>
                </div>
              </div>
            </div>

            {/* Timeline Item 4 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">18h10 – 18h25</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">18h10 – 18h25</span>
                  <h4 className="font-bold text-slate-800 text-lg">Méditation</h4>
                  <p className="text-slate-600">Séance individuelle et collective de ZIKR, Invocations sous séquence audio de lecture coranique.</p>
                </div>
              </div>
            </div>

            {/* Timeline Item 5 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">18h25 – 18h50</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">18h25 – 18h50</span>
                  <h4 className="font-bold text-slate-800 text-lg">Rupture & Prière</h4>
                  <p className="text-slate-600">IFTAR et prière de maghrib</p>
                </div>
              </div>
            </div>

            {/* Timeline Item 6 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">18h50 – 19h20</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">18h50 – 19h20</span>
                  <h4 className="font-bold text-slate-800 text-lg">Cérémonie Officielle</h4>
                  <ul className="text-slate-600 list-disc ml-4 mt-2 space-y-1">
                    <li>Projection d'un film Institutionnel sur LA CITADELLE</li>
                    <li>Allocutions (Directeur Exécutif, PCA)</li>
                    <li>Communication du Parrain TOURE Faman</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Timeline Item 7 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">19h25 – 19h45</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">19h25 – 19h45</span>
                  <h4 className="font-bold text-slate-800 text-lg">Prières du Soir</h4>
                  <p className="text-slate-600">Salat ICHAI, TARAWIH et Bénédictions QUNUT</p>
                </div>
              </div>
            </div>

            {/* Timeline Item 8 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">19h45 – 20h30</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">19h45 – 20h30</span>
                  <h4 className="font-bold text-slate-800 text-lg">Dîner & Défilé</h4>
                  <p className="text-slate-600">Dîner ponctué d'une présentation de tuniques homme et dame de YONI Couture</p>
                </div>
              </div>
            </div>

            {/* Timeline Item 9 */}
            <div className="relative pl-8 md:pl-0">
              <div className="md:flex items-center justify-between w-full">
                <div className="hidden md:block w-5/12 text-right pr-8">
                  <span className="text-amber-600 font-bold text-lg">20h30</span>
                </div>
                <div className="absolute left-[-9px] md:left-1/2 md:-ml-[9px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow z-10"></div>
                <div className="md:w-5/12 md:pl-8">
                  <span className="md:hidden text-amber-600 font-bold block mb-1">20h30</span>
                  <h4 className="font-bold text-slate-800 text-lg">Clôture</h4>
                  <p className="text-slate-600">Douah Final et départ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Section */}
        <div className="pt-4 pb-10" id="inscription">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-900 p-6 text-center">
              <h2 className="text-2xl font-bold text-white">Réservez votre place</h2>
              <p className="text-emerald-100 mt-2">Remplissez le formulaire ci-dessous pour participer à l'événement</p>
            </div>
            
            <div className="p-6 md:p-8">
              <Alert className="bg-amber-50 border-amber-200 mb-8">
                <Info className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800 font-bold">Information importante</AlertTitle>
                <AlertDescription className="text-amber-700 mt-1">
                  Tous les champs du formulaire sont obligatoires. Après votre inscription, vous serez dirigé vers la page de paiement sécurisé.
                </AlertDescription>
              </Alert>

              <div className="max-w-2xl mx-auto">
                <RegisterForm />
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Motif islamique décoratif en bas de page */}
      <div className="w-full flex justify-center pb-16 opacity-40">
        <div className="h-12 w-64 bg-contain bg-center bg-no-repeat" 
             style={{ backgroundImage: "url('https://i.pinimg.com/originals/3e/0a/d7/3e0ad78af1ba7e3870f73f7694f30fb7.png')" }}>
        </div>
      </div>
      
      {/* Bande décorative aux couleurs ivoiriennes en bas de la page */}
      <div className="fixed bottom-0 left-0 w-full h-1.5 flex z-50">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-emerald-600 w-1/3 h-full"></div>
      </div>
    </div>
  );
};

export default Index;
