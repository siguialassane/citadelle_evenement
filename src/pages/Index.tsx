
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
import { Info, Lock, Calendar, MapPin, Clock, Users, Award, Film, Mic, Coffee, Star, Heart, Book, Gift, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EventLogo from "@/components/EventLogo";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 relative">
        {/* Bande décorative aux couleurs ivoiriennes en haut de la page */}
        <div className="fixed top-0 left-0 w-full h-2 flex">
          <div className="bg-orange-500 w-1/3 h-full"></div>
          <div className="bg-white w-1/3 h-full"></div>
          <div className="bg-green-600 w-1/3 h-full"></div>
        </div>
        
        {/* En-tête avec logo et titre */}
        <div className="text-center mb-12">
          <EventLogo size="large" />
          
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block text-green-700">IFTAR 2025</span>
            <span className="block text-orange-500 text-3xl sm:text-4xl">14e Édition</span>
          </h1>
        </div>
        
        {/* Informations de l'événement */}
        <div className="bg-gray-50 rounded-xl shadow-md p-6 mb-12">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Informations de l'événement</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Calendar className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Date</h3>
                <p className="text-gray-600">15 Mars 2025</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Clock className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Heure</h3>
                <p className="text-gray-600">15h30</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Lieu</h3>
                <p className="text-gray-600">LA CITADELLE</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Users className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Participation</h3>
                <p className="text-gray-600">30 000 FCFA</p>
                <p className="text-sm text-green-700">incluant 5 plats chauds à offrir aux familles en difficulté</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold text-xl text-green-700 mb-2">Au programme:</h3>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Conférence sur le thème: <span className="text-green-700 font-medium">« Préservation de la paix et de la cohésion sociale : quelle contribution du cadre musulman ? »</span></li>
              <li>Animateur: <span className="font-medium">Imam YAO Mamadou DIARRASSOUBA</span>, Imam Mosquée Al imane de Koumassi Remblais</li>
              <li>IFTAR et prière de maghrib</li>
              <li>Projection d'un film Institutionnel sur LA CITADELLE</li>
              <li>Salat ICHAI, TARAWIH et Bénédictions QUNUT</li>
            </ul>
          </div>
        </div>
          
        {/* Programme détaillé - version tableau */}
        <div className="mb-12">
          <Accordion type="single" collapsible className="w-full bg-white rounded-xl shadow-md overflow-hidden">
            <AccordionItem value="program">
              <AccordionTrigger className="px-6 py-4 bg-green-50 hover:bg-green-100 border-b border-green-100 flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-green-700" />
                  <h2 className="text-xl font-bold text-green-700">Programme détaillé</h2>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 bg-orange-100 text-orange-700 px-4 py-2 w-1/5">Heure</th>
                        <th className="border border-gray-300 bg-green-100 text-green-700 px-4 py-2 w-4/5">Agendas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">15h30</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Accueil et installation des participants dans la salle de prière
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">16h00 – 16h45</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          <ul className="list-disc ml-5">
                            <li>Prière de Asr</li>
                            <li>Zikr Collectif demande de pardon (124.000 Astaghfirou laha wa atoubou ilahi)</li>
                            <li>Lecture de la sourate Yasin (21 Fois)</li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">16h45 – 16h50</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Mise en place en salle de conférence
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">16h50 – 16h55</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Douah d'ouverture et Allocution de bienvenue (PCO) – Hadja Sarah Sinan CISSE
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">16h55 – 18h00</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="font-bold text-gray-800">Conférence : « Préservation de la paix et de la cohésion sociale : quelle contribution du cadre musulman ? »</div>
                          <div className="mt-1"><span className="font-semibold">Animateur :</span> Imam Yao Mamadou DIARRASSOUBA, Imam Mosquée Al imane de Koumassi Remblais</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">18h00 – 18h10</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Renouvellement Ablutions
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">18h10 – 18h25</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Séance individuelle et collective de ZIKR, Invocations individuelles sous séquence audio de lecture coranique et d'instant de méditation.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">18h25 – 18h50</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          IFTAR et prière de maghrib
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">18h50 – 19h05</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Projection d'un film Institutionnel sur LA CITADELLE précédé d'un slam
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">19h05 – 19h10</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Allocution du Directeur Exécutif de LA CITADELLE
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">19h10 – 19h15</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Allocution du PCA de LA CITADELLE
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">19h15 – 19h20</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Communication du Parrain TOURE Faman
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">19h25 – 19h45</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Salat ICHAI, TARAWIH et Bénédictions QUNUT
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">19h45 – 20h30</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Dîner <span className="font-italic">ponctué</span> d'une présentation de tuniques homme et dame de YONI Couture
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-orange-600 font-semibold">20h30 – 20h35</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          Douah Final et départ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Alerte d'information */}
        <Alert className="bg-green-50 border-green-200 mb-10">
          <Info className="h-4 w-4 text-green-700" />
          <AlertTitle className="text-green-800">Information importante</AlertTitle>
          <AlertDescription className="text-green-700">
            Tous les champs du formulaire sont obligatoires. Après votre inscription, vous serez dirigé vers la page de paiement.
          </AlertDescription>
        </Alert>

        {/* Formulaire d'inscription */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-green-700 mb-6">Inscription à l'événement</h2>
          <RegisterForm />
        </div>
        
        {/* Motif islamique décoratif en bas de page */}
        <div className="w-full flex justify-center my-10">
          <div className="h-8 w-64 bg-contain bg-center bg-no-repeat" 
               style={{ backgroundImage: "url('https://i.pinimg.com/originals/3e/0a/d7/3e0ad78af1ba7e3870f73f7694f30fb7.png')" }}>
          </div>
        </div>
        
        {/* Bouton d'accès admin */}
        <div className="fixed bottom-5 right-5">
          <Button 
            onClick={() => navigate("/admin/login")}
            className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Accès Admin
          </Button>
        </div>
      </div>
      
      {/* Bande décorative aux couleurs ivoiriennes en bas de la page */}
      <div className="fixed bottom-0 left-0 w-full h-2 flex">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-green-600 w-1/3 h-full"></div>
      </div>
    </>
  );
};

export default Index;
