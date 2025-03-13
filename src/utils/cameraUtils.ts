
// Utilitaires pour la gestion de la caméra et le scan de QR codes
// Modifications:
// - Ajout de polyfills et détection de navigateur pour améliorer la compatibilité
// - Meilleure gestion des permissions
// - Plus de configurations de caméra pour différents appareils
// - Amélioration des logs de débogage

/**
 * Vérifie si l'appareil possède une caméra accessible
 */
export const checkCameraAvailability = async (): Promise<{hasCamera: boolean, errorMessage?: string}> => {
  try {
    console.log("Vérification de la disponibilité de la caméra...");
    
    // Vérifier si mediaDevices est supporté
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.error("MediaDevices API non supportée par ce navigateur");
      return { 
        hasCamera: false, 
        errorMessage: "Votre navigateur ne supporte pas l'accès à la caméra. Essayez avec Chrome ou Safari récent." 
      };
    }
    
    // Vérifier si nous sommes sur un appareil mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("Appareil mobile détecté:", isMobile);
    
    // Sur iOS, nous devons d'abord demander la permission avant de pouvoir énumérer les appareils
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      console.log("Appareil iOS détecté, demande d'autorisation préalable...");
      try {
        // Obtenir un stream temporaire pour déclencher la demande de permission
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Arrêter le stream immédiatement
        tempStream.getTracks().forEach(track => track.stop());
        console.log("Autorisation accordée sur iOS");
      } catch (iosError) {
        console.error("Autorisation refusée sur iOS:", iosError);
        return { 
          hasCamera: false, 
          errorMessage: "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur." 
        };
      }
    }

    // Maintenant énumérer les appareils
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log("Appareils détectés:", devices.length);
    devices.forEach((device, index) => {
      console.log(`Appareil ${index}:`, device.kind, device.label || "sans étiquette");
    });
    
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log("Caméras disponibles:", videoDevices.length);
    
    if (videoDevices.length === 0) {
      return { 
        hasCamera: false, 
        errorMessage: "Aucune caméra détectée sur cet appareil" 
      };
    }
    
    return { hasCamera: true };
  } catch (error) {
    console.error("Erreur inattendue lors de la vérification de la caméra:", error);
    return { 
      hasCamera: false, 
      errorMessage: "Impossible d'accéder à la caméra. Vérifiez vos permissions." 
    };
  }
};

/**
 * Détecte le type de navigateur et plateforme pour des configurations optimales
 */
const detectBrowserAndPlatform = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /Chrome/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  
  console.log("Détection navigateur:", { isIOS, isAndroid, isSafari, isChrome, isSamsung });
  
  return { isIOS, isAndroid, isSafari, isChrome, isSamsung };
};

/**
 * Obtient les contraintes optimales pour la caméra arrière
 */
export const getOptimalCameraConstraints = async () => {
  try {
    const { isIOS, isAndroid, isSafari } = detectBrowserAndPlatform();
    
    // Essaie d'obtenir la liste des caméras
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    
    console.log(`${cameras.length} caméras détectées`);
    cameras.forEach((camera, index) => {
      console.log(`Caméra ${index}: ${camera.label || 'sans nom'}, ID: ${camera.deviceId.substring(0, 10)}...`);
    });
    
    // Configurations spécifiques selon la plateforme
    if (isIOS && isSafari) {
      console.log("Configuration spécifique pour Safari iOS");
      return {
        facingMode: "environment",
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        aspectRatio: 1.777777778
      };
    }
    
    if (isAndroid) {
      console.log("Configuration spécifique pour Android");
      // Sur Android, essayons de trouver explicitement la caméra arrière
      if (cameras.length > 1) {
        const backCamera = cameras.find(camera => 
          (camera.label || '').toLowerCase().includes('back') || 
          (camera.label || '').toLowerCase().includes('arrière') ||
          // Sur certains appareils Samsung, la caméra arrière est souvent la seconde
          (cameras.length === 2 && cameras.indexOf(camera) === 1)
        );
        
        if (backCamera && backCamera.deviceId) {
          console.log("Caméra arrière Android identifiée avec ID:", backCamera.deviceId.substring(0, 10) + "...");
          return { 
            deviceId: { exact: backCamera.deviceId },
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          };
        }
      }
    }
    
    // Si nous avons plusieurs caméras, essayons de trouver la caméra arrière
    if (cameras.length > 1) {
      // Sur la plupart des appareils, la caméra arrière a souvent "back" dans son label
      const backCamera = cameras.find(camera => 
        (camera.label || '').toLowerCase().includes('back') || 
        (camera.label || '').toLowerCase().includes('arrière')
      );
      
      if (backCamera && backCamera.deviceId) {
        console.log("Caméra arrière trouvée avec ID:", backCamera.deviceId.substring(0, 10) + "...");
        return { 
          deviceId: { exact: backCamera.deviceId },
          facingMode: "environment",
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        };
      }
    }
    
    // Configuration par défaut pour la caméra arrière
    console.log("Utilisation de la configuration générique environment");
    return {
      facingMode: "environment",
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 }
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des contraintes de caméra:", error);
    // Fallback sur les paramètres de base
    return { facingMode: "environment" };
  }
};

/**
 * Essaie différentes configurations de caméra pour maximiser la compatibilité
 */
export const tryMultipleCameraConfigurations = async (startScanFn: (constraints: any) => Promise<boolean>): Promise<boolean> => {
  try {
    const { isIOS, isAndroid, isSafari, isChrome } = detectBrowserAndPlatform();
    console.log("Tentative avec plusieurs configurations de caméra");
    
    // 1. Essayons d'abord avec la configuration optimale
    const optimalConstraints = await getOptimalCameraConstraints();
    console.log("Tentative avec contraintes optimales:", JSON.stringify(optimalConstraints));
    const optimalSuccess = await startScanFn(optimalConstraints).catch(err => {
      console.error("Échec avec contraintes optimales:", err);
      return false;
    });
    if (optimalSuccess) {
      console.log("Succès avec contraintes optimales");
      return true;
    }
    
    // 2. Configuration spécifique à iOS Safari si applicable
    if (isIOS && isSafari) {
      console.log("Tentative spécifique iOS Safari");
      const iosSafariConstraints = {
        facingMode: { exact: "environment" },
        width: { min: 320, ideal: 640, max: 1280 },
        height: { min: 240, ideal: 480, max: 720 }
      };
      const iosSafariSuccess = await startScanFn(iosSafariConstraints).catch(err => {
        console.error("Échec avec contraintes iOS Safari:", err);
        return false;
      });
      if (iosSafariSuccess) {
        console.log("Succès avec contraintes iOS Safari");
        return true;
      }
    }

    // 3. Si échec, essayons la caméra arrière simple
    console.log("Tentative avec caméra arrière simple");
    const backConstraints = { facingMode: "environment" };
    const backSuccess = await startScanFn(backConstraints).catch(err => {
      console.error("Échec avec caméra arrière simple:", err);
      return false;
    });
    if (backSuccess) {
      console.log("Succès avec caméra arrière simple");
      return true;
    }
    
    // 4. Contraintes simplifiées pour les appareils Android
    if (isAndroid) {
      console.log("Tentative avec contraintes Android simplifiées");
      const androidConstraints = { 
        video: {
          facingMode: "environment",
          width: { min: 320, ideal: 640 },
          height: { min: 240, ideal: 480 }
        }
      };
      const androidSuccess = await startScanFn(androidConstraints).catch(err => {
        console.error("Échec avec contraintes Android simplifiées:", err);
        return false;
      });
      if (androidSuccess) {
        console.log("Succès avec contraintes Android simplifiées");
        return true;
      }
    }
    
    // 5. Si échec, essayons la caméra avant
    console.log("Tentative avec caméra avant");
    const frontSuccess = await startScanFn({ facingMode: "user" }).catch(err => {
      console.error("Échec avec caméra avant:", err);
      return false;
    });
    if (frontSuccess) {
      console.log("Succès avec caméra avant");
      return true;
    }
    
    // 6. Dernier recours, essayons sans contraintes spécifiques
    console.log("Tentative sans contraintes");
    const anySuccess = await startScanFn({}).catch(err => {
      console.error("Échec sans contraintes:", err);
      return false;
    });
    
    if (anySuccess) {
      console.log("Succès sans contraintes");
    } else {
      console.error("Toutes les tentatives ont échoué");
    }
    
    return anySuccess;
    
  } catch (error) {
    console.error("Erreur globale lors des tentatives de caméra:", error);
    return false;
  }
};

/**
 * Analyse une URL pour extraire l'ID du participant
 */
export const extractParticipantIdFromQR = (qrContent: string): string | null => {
  try {
    console.log("Analyse du contenu QR:", qrContent);
    
    // Si le QR contient déjà un UUID sans URL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(qrContent)) {
      console.log("UUID direct détecté:", qrContent);
      return qrContent;
    }
    
    // Si le QR contient une URL
    if (qrContent.includes('/')) {
      console.log("URL détectée dans le QR code");
      // Extrait le dernier segment de l'URL
      const parts = qrContent.split('/');
      const lastPart = parts[parts.length - 1];
      
      console.log("Dernier segment de l'URL:", lastPart);
      
      // Vérifie si c'est un UUID
      if (uuidRegex.test(lastPart)) {
        console.log("UUID extrait de l'URL:", lastPart);
        return lastPart;
      }
    }
    
    console.log("Aucun UUID valide trouvé dans le contenu QR");
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'ID:", error);
    return null;
  }
};

/**
 * Vérifie si le navigateur est supporté pour le scan de QR code
 */
export const checkBrowserSupport = (): { isSupported: boolean, message: string } => {
  const { isIOS, isAndroid, isSafari, isChrome, isSamsung } = detectBrowserAndPlatform();
  
  // Safari sur iOS 11+ est supporté
  if (isIOS) {
    if (isSafari) {
      return { 
        isSupported: true, 
        message: "Safari sur iOS est compatible. Assurez-vous d'autoriser l'accès à la caméra." 
      };
    } else {
      return { 
        isSupported: false, 
        message: "Sur iOS, veuillez utiliser Safari pour un meilleur support de la caméra." 
      };
    }
  }
  
  // Chrome, Samsung Browser sur Android sont bien supportés
  if (isAndroid) {
    if (isChrome || isSamsung) {
      return { 
        isSupported: true, 
        message: "Votre navigateur est compatible avec le scan de QR code." 
      };
    }
  }
  
  // Par défaut, supposons que c'est supporté mais avertissons l'utilisateur
  return { 
    isSupported: true, 
    message: "Votre navigateur devrait être compatible, mais en cas de problème, essayez Chrome ou Safari." 
  };
};
