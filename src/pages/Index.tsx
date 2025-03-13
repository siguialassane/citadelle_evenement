// Page d'accueil principale de l'application
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, User, Info, ArrowRight } from "lucide-react";
import EventLogo from "@/components/EventLogo";

export default function Index() {
  return (
    <div className="min-h-screen">
      <header className="bg-green-600 text-white py-8">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-center">Iftar Annuel 2025</h1>
          <p className="text-xl mt-2 text-center">La Citadelle du Musulman</p>
          <div className="mt-4">
            <EventLogo size="large" />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <section className="max-w-3xl mx-auto mb-10">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-50 p-6 border-b border-green-100">
              <h2 className="text-2xl font-bold text-green-800">Participez à notre événement</h2>
              <p className="mt-2 text-gray-600">
                Rejoignez-nous pour notre Iftar annuel organisé par La Citadelle du Musulman.
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Date et lieu</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <Calendar className="h-5 w-5 text-green-600 mr-2 mt-0.5 shrink-0" />
                      <span>Samedi 5 Avril 2025</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 text-green-600 mr-2 mt-0.5 shrink-0" />
                      <span>De 17h à 21h</span>
                    </li>
                    <li className="flex items-start">
                      <MapPin className="h-5 w-5 text-green-600 mr-2 mt-0.5 shrink-0" />
                      <span>Hôtel Président, Abidjan Plateau</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Tarifs</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <Users className="h-5 w-5 text-green-600 mr-2 mt-0.5 shrink-0" />
                      <span>Membres: 10.000 FCFA</span>
                    </li>
                    <li className="flex items-start">
                      <User className="h-5 w-5 text-green-600 mr-2 mt-0.5 shrink-0" />
                      <span>Non-membres: 15.000 FCFA</span>
                    </li>
                    <li className="flex items-start">
                      <Info className="h-5 w-5 text-green-600 mr-2 mt-0.5 shrink-0" />
                      <span>Places limitées</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Programme détaillé</h3>
                
                {/* Programme détaillé - affiché par défaut */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-4">
                    <li>
                      <div className="flex items-center">
                        <div className="bg-green-600 text-white w-14 text-center py-1 rounded">17h00</div>
                        <div className="ml-3">
                          <p className="font-medium">Accueil des participants</p>
                          <p className="text-sm text-gray-500">Enregistrement et installation</p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <div className="bg-green-600 text-white w-14 text-center py-1 rounded">17h30</div>
                        <div className="ml-3">
                          <p className="font-medium">Récitation du Saint Coran</p>
                          <p className="text-sm text-gray-500">Par Cheikh Ousmane Diallo</p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <div className="bg-green-600 text-white w-14 text-center py-1 rounded">18h00</div>
                        <div className="ml-3">
                          <p className="font-medium">Conférence: "Le Ramadan, mois de partage"</p>
                          <p className="text-sm text-gray-500">Par Dr. Ibrahim Koné</p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <div className="bg-green-600 text-white w-14 text-center py-1 rounded">18h45</div>
                        <div className="ml-3">
                          <p className="font-medium">Appel à la prière (Adhan)</p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <div className="bg-green-600 text-white w-14 text-center py-1 rounded">19h00</div>
                        <div className="ml-3">
                          <p className="font-medium">Rupture du jeûne (Iftar)</p>
                          <p className="text-sm text-gray-500">Repas traditionnel</p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <div className="bg-green-600 text-white w-14 text-center py-1 rounded">19h30</div>
                        <div className="ml-3">
                          <p className="font-medium">Prière du Maghreb en congrégation</p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <div className="bg-green-600 text-white w-14 text-center py-1 rounded">20h00</div>
                        <div className="ml-3">
                          <p className="font-medium">Dîner et échanges</p>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <div className="bg-green-600 text-white w-14 text-center py-1 rounded">21h00</div>
                        <div className="ml-3">
                          <p className="font-medium">Clôture de l'événement</p>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Bouton d'inscription */}
        <div className="flex justify-center">
          <Link to="/register">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
              S'inscrire maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </main>
      
      <footer className="bg-gray-100 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 La Citadelle du Musulman. Tous droits réservés.</p>
          <div className="mt-2 flex justify-center">
            <EventLogo size="small" />
          </div>
        </div>
      </footer>
    </div>
  );
}
