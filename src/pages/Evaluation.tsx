import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, CheckCircle2, Star, MapPin, BookOpen, Users, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { EventLogo } from '@/components/EventLogo';

type Note = 'mauvais' | 'passable' | 'bon' | 'excellent';

const NOTES: { value: Note; label: string }[] = [
  { value: 'mauvais',   label: 'Insuffisant' },
  { value: 'passable',  label: 'Passable'    },
  { value: 'bon',       label: 'Bien'        },
  { value: 'excellent', label: 'Excellent'   },
];

interface RatingCardProps {
  label: string;
  value: Note | '';
  onChange: (v: Note) => void;
  comment?: string;
  onCommentChange?: (v: string) => void;
}

const RatingCard: React.FC<RatingCardProps> = ({ label, value, onChange, comment, onCommentChange }) => {
  const [showComment, setShowComment] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
      <p className="font-medium text-gray-700 text-sm leading-snug">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {NOTES.map((note, index) => {
          const active = value === note.value;
          const colors = [
            active ? 'border-red-400 bg-red-500 text-white' : 'border-gray-200 text-gray-600 hover:border-red-300',
            active ? 'border-amber-400 bg-amber-500 text-white' : 'border-gray-200 text-gray-600 hover:border-amber-300',
            active ? 'border-green-500 bg-green-600 text-white' : 'border-gray-200 text-gray-600 hover:border-green-400',
            active ? 'border-emerald-600 bg-emerald-700 text-white' : 'border-gray-200 text-gray-600 hover:border-emerald-500',
          ];
          return (
            <button
              key={note.value}
              type="button"
              onClick={() => onChange(note.value)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all active:scale-95 ${colors[index]}`}
            >
              {note.label}
            </button>
          );
        })}
      </div>
      {onCommentChange && (
        !showComment ? (
          <button type="button" onClick={() => setShowComment(true)}
            className="text-green-600 text-xs font-medium hover:underline">
            + Ajouter un commentaire
          </button>
        ) : (
          <Textarea placeholder="Votre commentaire..." value={comment ?? ''}
            onChange={e => onCommentChange(e.target.value)} className="text-sm bg-gray-50" rows={2} />
        )
      )}
    </div>
  );
};

const STEPS = [
  { id: 0, label: 'Général',     icon: Star },
  { id: 1, label: 'Détails',     icon: BookOpen },
  { id: 2, label: 'Observations',icon: MessageSquare },
  { id: 3, label: 'Suite',       icon: RefreshCw },
];

export default function Evaluation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [noteGlobale, setNoteGlobale] = useState<Note | ''>('');
  const [noteLieu, setNoteLieu] = useState<Note | ''>('');
  const [commentaireLieu, setCommentaireLieu] = useState('');
  const [noteContenu, setNoteContenu] = useState<Note | ''>('');
  const [commentaireContenu, setCommentaireContenu] = useState('');
  const [noteAnimateurs, setNoteAnimateurs] = useState<Note | ''>('');
  const [commentaireAnimateurs, setCommentaireAnimateurs] = useState('');
  const [noteTiming, setNoteTiming] = useState<Note | ''>('');
  const [commentaireTiming, setCommentaireTiming] = useState('');
  const [momentApprecié, setMomentApprecié] = useState('');
  const [ceQuiAManqué, setCeQuiAManqué] = useState('');
  const [animateurApprecié, setAnimateurApprecié] = useState('');
  const [autresRemarques, setAutresRemarques] = useState('');
  const [renouveler, setRenouveler] = useState<boolean | null>(null);
  const [frequence, setFrequence] = useState('');

  const goTo = (next: number) => {
    if (animating) return;
    setDirection(next > step ? 'forward' : 'back');
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 220);
  };

  const canProceed = () => {
    if (step === 0) return noteGlobale !== '';
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('evaluations').insert({
      note_globale: noteGlobale || null,
      note_lieu: noteLieu || null,
      commentaire_lieu: commentaireLieu || null,
      note_contenu: noteContenu || null,
      commentaire_contenu: commentaireContenu || null,
      note_animateurs: noteAnimateurs || null,
      commentaire_animateurs: commentaireAnimateurs || null,
      note_timing: noteTiming || null,
      commentaire_timing: commentaireTiming || null,
      moment_apprecie: momentApprecié || null,
      ce_qui_a_manque: ceQuiAManqué || null,
      animateur_apprecie: animateurApprecié || null,
      autres_remarques: autresRemarques || null,
      renouveler,
      frequence: frequence || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setSubmitted(true);
    }
  };

  const slideClass = animating
    ? direction === 'forward'
      ? 'opacity-0 -translate-x-4'
      : 'opacity-0 translate-x-4'
    : 'opacity-100 translate-x-0';

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full space-y-5">
          <div className="flex justify-center">
            <div className="bg-green-50 rounded-full p-4 border border-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Merci pour votre évaluation</h2>
            <p className="text-gray-500 text-sm mt-2">Vos retours nous aident à améliorer nos prochains événements.</p>
          </div>
          <Button onClick={() => navigate('/')} className="w-full bg-green-600 hover:bg-green-700 text-white">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header fixe */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button type="button" onClick={() => step > 0 ? goTo(step - 1) : navigate(-1)}
              className="text-gray-500 hover:text-gray-700 p-1 -ml-1">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 text-center">
              <EventLogo size="small" showSlogan={false} />
            </div>
            <div className="w-7" />
          </div>
          <p className="text-center text-xs text-gray-400 mb-2">Étape {step + 1} sur {STEPS.length}</p>
          {/* Barre de progression */}
          <div className="w-full bg-gray-100 rounded-full h-1 mb-3">
            <div
              className="bg-green-600 h-1 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          {/* Indicateurs d'étapes */}
          <div className="flex justify-between">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const done = s.id < step;
              const active = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => s.id < step ? goTo(s.id) : undefined}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    done    ? 'bg-green-600 border-green-600 text-white' :
                    active  ? 'bg-white border-green-600 text-green-600' :
                              'bg-white border-gray-200 text-gray-300'
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-green-700' : done ? 'text-green-500' : 'text-gray-300'}`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className={`max-w-lg mx-auto transition-all duration-200 ${slideClass}`}>

          {/* Étape 0 — Général */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">Évaluation Générale</h2>
                <p className="text-gray-400 text-sm mt-0.5">Donnez une appréciation globale de l'événement</p>
              </div>
              <RatingCard
                label="Comment évalueriez-vous globalement cette activité ?"
                value={noteGlobale}
                onChange={setNoteGlobale}
              />
              {!noteGlobale && (
                <p className="text-xs text-red-400 mt-1">* Note obligatoire pour passer à l'étape suivante</p>
              )}
            </div>
          )}

          {/* Étape 1 — Détails */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">Évaluation Détaillée</h2>
                <p className="text-gray-400 text-sm mt-0.5">Notez chaque aspect de l'événement</p>
              </div>
              {[
                { icon: MapPin,   label: 'Lieu',         note: noteLieu,       setNote: setNoteLieu,       commentaire: commentaireLieu,       setCommentaire: setCommentaireLieu },
                { icon: BookOpen, label: 'Contenu',      note: noteContenu,    setNote: setNoteContenu,    commentaire: commentaireContenu,    setCommentaire: setCommentaireContenu },
                { icon: Users,    label: 'Animateurs',   note: noteAnimateurs, setNote: setNoteAnimateurs, commentaire: commentaireAnimateurs, setCommentaire: setCommentaireAnimateurs },
                { icon: Clock,    label: 'Timing',       note: noteTiming,     setNote: setNoteTiming,     commentaire: commentaireTiming,     setCommentaire: setCommentaireTiming },
              ].map(({ icon: Icon, label, note, setNote, commentaire, setCommentaire }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-bold text-green-700 uppercase tracking-widest">{label}</span>
                  </div>
                  <RatingCard
                    label={`Le ${label.toLowerCase()} de l'activité`}
                    value={note}
                    onChange={setNote}
                    comment={commentaire}
                    onCommentChange={setCommentaire}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Étape 2 — Observations */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">Vos Observations</h2>
                <p className="text-gray-400 text-sm mt-0.5">Tous les champs sont optionnels</p>
              </div>
              {[
                { label: 'Quel moment avez-vous le plus apprécié ?', value: momentApprecié, set: setMomentApprecié, placeholder: 'Ex. : les échanges en table ronde…' },
                { label: "Qu'est-ce qui a manqué ?", value: ceQuiAManqué, set: setCeQuiAManqué, placeholder: "Vos suggestions d'amélioration..." },
                { label: "Quel animateur avez-vous le plus apprécié ?", value: animateurApprecié, set: setAnimateurApprecié, placeholder: "Nom de l'animateur..." },
                { label: 'Autres remarques', value: autresRemarques, set: setAutresRemarques, placeholder: 'Tout ce que vous souhaitez nous dire...' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <Textarea value={value} onChange={e => set(e.target.value)} rows={3}
                    placeholder={placeholder} className="bg-gray-50 text-sm resize-none border-gray-200 focus:border-green-500 focus:ring-green-500" />
                </div>
              ))}
            </div>
          )}

          {/* Étape 3 — Suite */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">Dernière étape</h2>
                <p className="text-gray-400 text-sm mt-0.5">Vérifiez vos réponses avant de valider</p>
              </div>

              {/* Récap */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-green-600 px-4 py-2.5">
                  <p className="text-white text-xs font-bold uppercase tracking-widest">Récapitulatif des notes</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { label: 'Note globale', value: noteGlobale },
                    { label: 'Lieu',         value: noteLieu },
                    { label: 'Contenu',      value: noteContenu },
                    { label: 'Animateurs',   value: noteAnimateurs },
                    { label: 'Timing',       value: noteTiming },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      {item.value ? (
                        <span className={`font-semibold capitalize px-2 py-0.5 rounded-md text-xs ${
                          item.value === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                          item.value === 'bon'       ? 'bg-green-100 text-green-700' :
                          item.value === 'passable'  ? 'bg-amber-100 text-amber-700' :
                                                       'bg-red-100 text-red-600'
                        }`}>{item.value === 'mauvais' ? 'Insuffisant' : item.value}</span>
                      ) : (
                        <span className="text-gray-300 text-xs italic">Non renseigné</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Renouveler */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Seriez-vous prêt à renouveler cette expérience ?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Oui', val: true }, { label: 'Non', val: false }].map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setRenouveler(opt.val)}
                      className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-all active:scale-95 ${
                        renouveler === opt.val
                          ? opt.val ? 'border-green-600 bg-green-600 text-white' : 'border-red-400 bg-red-500 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {renouveler === true && (
                  <div className="pt-1">
                    <label className="block text-xs text-gray-500 mb-1.5">À quelle fréquence ?</label>
                    <Input value={frequence} onChange={e => setFrequence(e.target.value)}
                      placeholder="Ex. : annuelle, semestrielle…"
                      className="bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500" />
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-sm font-bold rounded-xl shadow-md tracking-wide"
              >
                {submitting ? 'Envoi en cours…' : 'Soumettre mon évaluation'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      {step < STEPS.length - 1 && (
        <div className="bg-white border-t border-gray-100 px-4 py-3 sticky bottom-0">
          <div className="max-w-lg mx-auto">
            <Button
              type="button"
              onClick={() => {
                if (!canProceed()) {
                  toast({ title: 'Note requise', description: 'Veuillez sélectionner une note globale pour continuer.', variant: 'destructive' });
                  return;
                }
                goTo(step + 1);
              }}
              className={`w-full py-3 text-sm font-semibold rounded-xl tracking-wide transition-all ${
                canProceed()
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Étape suivante <ArrowRight className="h-4 w-4 ml-1 inline" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
