import * as React from "react";

// CAMBIO AQUÍ: 1200px para activar el modo mobile (overlay)
const MOBILE_BREAKPOINT = 1200; 
const LARGE_BREAKPOINT = 1400;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      console.log(`useIsMobile: window.innerWidth=${window.innerWidth}, MOBILE_BREAKPOINT=${MOBILE_BREAKPOINT}, isMobile=${newIsMobile}`);
      setIsMobile(newIsMobile);
    };
    mql.addEventListener("change", onChange);
    const initialIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(initialIsMobile);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsLargeScreen() {
  const [isLarge, setIsLarge] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Detectar pantallas mayores a 1400px
    const mql = window.matchMedia(`(min-width: ${LARGE_BREAKPOINT}px)`);
    const onChange = () => {
      // Usamos >= para incluir 1400
      const newIsLarge = window.innerWidth >= LARGE_BREAKPOINT;
      console.log(`useIsLargeScreen: window.innerWidth=${window.innerWidth}, LARGE_BREAKPOINT=${LARGE_BREAKPOINT}, isLarge=${newIsLarge}`);
      setIsLarge(newIsLarge);
    };
    mql.addEventListener("change", onChange);
    const initialIsLarge = window.innerWidth >= LARGE_BREAKPOINT;
    setIsLarge(initialIsLarge);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isLarge;
}