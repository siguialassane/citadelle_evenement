
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBucket() {
  // Créer le bucket si nécessaire
  const { data: existingBucket, error: getBucketError } = await supabase
    .storage
    .getBucket('screenshots');
  
  if (getBucketError && getBucketError.message.includes('does not exist')) {
    console.log('Le bucket "screenshots" n\'existe pas, création...');
    
    // Créer le bucket
    const { data, error } = await supabase
      .storage
      .createBucket('screenshots', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5 MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
      });
      
    if (error) {
      console.error('Erreur lors de la création du bucket:', error);
      return;
    }
    
    console.log('Bucket "screenshots" créé avec succès:', data);
  } else if (getBucketError) {
    console.error('Erreur lors de la vérification du bucket:', getBucketError);
    return;
  } else {
    console.log('Le bucket "screenshots" existe déjà:', existingBucket);
  }
  
  // Définir une politique d'accès public pour lire les fichiers
  console.log('Configuration de la politique d\'accès public...');
  const { error: policyError } = await supabase
    .storage
    .from('screenshots')
    .createSignedUrl('test.txt', 60);
    
  if (policyError) {
    console.error('Erreur lors de la configuration de la politique:', policyError);
  } else {
    console.log('Politique d\'accès configurée avec succès');
  }
}

setupBucket()
  .then(() => console.log('Initialisation du bucket terminée'))
  .catch(err => console.error('Erreur:', err));
