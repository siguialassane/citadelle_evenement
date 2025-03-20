
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Fonction pour déterminer si l'appareil est mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Vérification initiale
    checkMobile();

    // Ajouter un écouteur pour les changements de taille d'écran
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Utiliser la méthode moderne addEventListener si disponible
    if (mql.addEventListener) {
      mql.addEventListener("change", checkMobile);
    } else {
      // Fallback pour les navigateurs plus anciens
      window.addEventListener("resize", checkMobile);
    }

    // Nettoyage
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", checkMobile);
      } else {
        window.removeEventListener("resize", checkMobile);
      }
    };
  }, []);

  return isMobile;
}
