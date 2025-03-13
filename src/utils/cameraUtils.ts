
// Utilitaires pour la gestion de la caméra et le scan de QR codes

/**
 * Vérifie si l'appareil possède une caméra accessible
 */
export const checkCameraAvailability = async (): Promise<{hasCamera: boolean, errorMessage?: string}> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideoInput = devices.some(device => device.kind === 'videoinput');
    
    if (!hasVideoInput) {
      return { hasCamera: false, errorMessage: "Aucune caméra détectée sur cet appareil" };
    }
    
    return { hasCamera: true };
  } catch (error) {
    console.error("Erreur lors de la vérification de la caméra:", error);
    return { 
      hasCamera: false, 
      errorMessage: "Impossible d'accéder à la caméra. Vérifiez vos permissions." 
    };
  }
};

/**
 * Obtient les contraintes optimales pour la caméra arrière
 */
export const getOptimalCameraConstraints = async () => {
  try {
    // Essaie d'obtenir la liste des caméras
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    
    // Si nous avons plusieurs caméras, essayons de trouver la caméra arrière
    if (cameras.length > 1) {
      // Sur Android, la caméra arrière a souvent "back" dans son label
      const backCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('arrière')
      );
      
      if (backCamera && backCamera.deviceId) {
        console.log("Caméra arrière trouvée avec ID:", backCamera.deviceId);
        return { 
          deviceId: { exact: backCamera.deviceId },
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        };
      }
    }
    
    // Si nous ne pouvons pas identifier spécifiquement la caméra arrière,
    // utilisons la configuration facingMode
    return {
      facingMode: "environment",
      width: { ideal: 1280 },
      height: { ideal: 720 }
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
    // 1. Essayons d'abord avec la configuration optimale
    const optimalConstraints = await getOptimalCameraConstraints();
    console.log("Tentative avec contraintes optimales:", optimalConstraints);
    const optimalSuccess = await startScanFn(optimalConstraints).catch(() => false);
    if (optimalSuccess) return true;
    
    // 2. Si échec, essayons la caméra arrière simple
    console.log("Tentative avec caméra arrière simple");
    const backSuccess = await startScanFn({ facingMode: "environment" }).catch(() => false);
    if (backSuccess) return true;
    
    // 3. Si échec, essayons la caméra avant
    console.log("Tentative avec caméra avant");
    const frontSuccess = await startScanFn({ facingMode: "user" }).catch(() => false);
    if (frontSuccess) return true;
    
    // 4. Dernier recours, essayons sans contraintes spécifiques
    console.log("Tentative sans contraintes");
    const anySuccess = await startScanFn({}).catch(() => false);
    return anySuccess;
    
  } catch (error) {
    console.error("Toutes les tentatives de caméra ont échoué:", error);
    return false;
  }
};

/**
 * Analyse une URL pour extraire l'ID du participant
 */
export const extractParticipantIdFromQR = (qrContent: string): string | null => {
  try {
    // Si le QR contient déjà un UUID sans URL
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(qrContent)) {
      return qrContent;
    }
    
    // Si le QR contient une URL
    if (qrContent.includes('/')) {
      // Extrait le dernier segment de l'URL
      const parts = qrContent.split('/');
      const lastPart = parts[parts.length - 1];
      
      // Vérifie si c'est un UUID
      if (uuidRegex.test(lastPart)) {
        return lastPart;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'ID:", error);
    return null;
  }
};
