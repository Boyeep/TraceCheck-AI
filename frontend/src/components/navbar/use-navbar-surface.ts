import type { CSSProperties } from "react";
import { useSyncExternalStore } from "react";
import {
  clamp,
  mix,
} from "./navbar-utils";

const NAV_SURFACE_START = 24;
const NAV_SURFACE_RANGE = 140;

const useScrollY = () =>
  useSyncExternalStore(
    (onStoreChange) => {
      let frame = 0;

      const handleChange = () => {
        if (frame) {
          return;
        }

        frame = window.requestAnimationFrame(() => {
          frame = 0;
          onStoreChange();
        });
      };

      window.addEventListener("scroll", handleChange, { passive: true });
      window.addEventListener("resize", handleChange);

      return () => {
        window.removeEventListener("scroll", handleChange);
        window.removeEventListener("resize", handleChange);
        if (frame) {
          window.cancelAnimationFrame(frame);
        }
      };
    },
    () => window.scrollY,
    () => 0,
  );

export const useNavbarSurface = (isMobileMenuOpen: boolean) => {
  const scrollY = useScrollY();
  const isAtTop = scrollY <= NAV_SURFACE_START;
  const progress = clamp((scrollY - NAV_SURFACE_START) / NAV_SURFACE_RANGE, 0, 1);
  const shouldForceMenuSurface = isMobileMenuOpen && isAtTop;
  const surfaceProgress = shouldForceMenuSurface ? 1 : progress;
  const hasScrolled = !isAtTop || shouldForceMenuSurface;

  const shellStyle: CSSProperties = {
    maxWidth: `${mix(1280, 1060, surfaceProgress)}px`,
    padding: `${mix(0, 12, surfaceProgress)}px ${mix(0, 20, surfaceProgress)}px`,
    borderRadius: `${mix(0, 24, surfaceProgress)}px`,
    background: `linear-gradient(90deg, rgba(85, 214, 170, ${shouldForceMenuSurface ? 0.18 : mix(0, 0.14, surfaceProgress)}) 0%, rgba(63, 178, 142, ${shouldForceMenuSurface ? 0.16 : mix(0, 0.12, surfaceProgress)}) 52%, rgba(32, 96, 84, ${shouldForceMenuSurface ? 0.18 : mix(0, 0.14, surfaceProgress)}) 100%), rgba(10, 18, 18, ${shouldForceMenuSurface ? 0.9 : mix(0, 0.86, surfaceProgress)})`,
    borderColor: `rgba(163, 193, 182, ${shouldForceMenuSurface ? 0.34 : mix(0, 0.28, surfaceProgress)})`,
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, ${shouldForceMenuSurface ? 0.08 : mix(0, 0.06, surfaceProgress)}), 0 24px 54px rgba(0, 0, 0, ${shouldForceMenuSurface ? 0.26 : mix(0, 0.22, surfaceProgress)})`,
    backdropFilter: `blur(${shouldForceMenuSurface ? 24 : mix(0, 22, surfaceProgress)}px) saturate(${shouldForceMenuSurface ? 150 : mix(100, 145, surfaceProgress)}%)`,
    WebkitBackdropFilter: `blur(${shouldForceMenuSurface ? 24 : mix(0, 22, surfaceProgress)}px) saturate(${shouldForceMenuSurface ? 150 : mix(100, 145, surfaceProgress)}%)`,
    transform: `translateY(${mix(10, 0, surfaceProgress)}px)`,
  };

  return {
    hasScrolled,
    shellStyle,
  };
};
