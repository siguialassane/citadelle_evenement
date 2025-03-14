
// Ce fichier contient la page principale d'inscription à l'événement
// Modifications:
// - Remplacement des couleurs belges par celles de la Côte d'Ivoire (orange, blanc, vert)
// - Amélioration du design pour correspondre au thème islamique
// - Ajout du programme détaillé déplié par défaut
// - Optimisation pour affichage mobile

import React from "react";
import { RegisterForm } from "@/components/RegisterForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Lock, Calendar, MapPin, Clock, Users, Award, Film, Mic, Coffee, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EventLogo from "@/components/EventLogo";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Bande décorative aux couleurs ivoiriennes en haut de la page */}
      <div className="fixed top-0 left-0 w-full h-2 flex">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-green-600 w-1/3 h-full"></div>
      </div>
      
      <div className="max-w-5xl mx-auto">
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
                <p className="text-gray-600">16h00</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Lieu</h3>
                <p className="text-gray-600">NOOM HOTEL, Plateau</p>
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
              <li>Conférence sur le thème: <span className="text-green-700 font-medium">Préservation de la paix et de la cohésion sociale: quelle contribution du cadre musulman</span></li>
              <li>Avec Imam YAO DIARRASSOUBA Mamadou</li>
              <li>Iftar & dîner en buffet</li>
              <li>Prière & Zikr</li>
            </ul>
          </div>
        </div>
        
        {/* Programme détaillé - maintenant affiché directement sans l'accordéon replié */}
        <div className="mb-12">
          <div className="w-full bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-green-700" />
                <h2 className="text-xl font-bold text-green-700">Programme détaillé</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Première colonne */}
                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">15H30 – 16H00</p>
                            <p className="text-gray-600">Accueil et installation</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Star className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">16H00 – 16H45</p>
                            <p className="text-gray-600">Prière de Asr, Zikr Collectif, Lecture de Yâsin</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">16H45 – 16H50</p>
                            <p className="text-gray-600">Mise en place en salle de conférence</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Mic className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">16H55 – 18H00</p>
                            <p className="text-gray-600">Conférence</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Star className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">18H00 – 18H25</p>
                            <p className="text-gray-600">Séance individuelle et collective de ZIKR</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Deuxième colonne */}
                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-green-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Coffee className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">18H25 – 18H50</p>
                            <p className="text-gray-600">IFTAR et Prière de Maghrib</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Mic className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">18H50 – 18H55</p>
                            <p className="text-gray-600">Slam</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Film className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">18H55 – 19H05</p>
                            <p className="text-gray-600">Projection d'un film Institutionnel sur LA CITADELLE</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Mic className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">19H05 – 19H10</p>
                            <p className="text-gray-600">Allocution du Directeur Exécutif de LA CITADELLE</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Mic className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">19H10 – 19H15</p>
                            <p className="text-gray-600">Allocution du PCA de LA CITADELLE</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Troisième colonne */}
                  <div className="space-y-4">
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Mic className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">19H15 – 19H20</p>
                            <p className="text-gray-600">Allocution du PARRAIN</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Mic className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">19H20 – 19H25</p>
                            <p className="text-gray-600">Communication du Cheikoul Ousmane DIAKITE</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Star className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">19H25 – 19H45</p>
                            <p className="text-gray-600">Salat ICHAI et TARAWIH</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Coffee className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">19H45 – 20H30</p>
                            <p className="text-gray-600">Dîner + défilé</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Star className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-bold text-gray-800">20H30 – 20H35</p>
                            <p className="text-gray-600">Douah Finale</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default Index;
