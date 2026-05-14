import { Dark, Light } from "./Colors";

// Returns the correct color palette based on isDark
export const getColors = (isDark) => (isDark ? Dark : Light);

// ── Landscape layout helpers ──────────────────────────────────────────────────

/**
 * Returns container props that split into a two-column layout in landscape.
 * Use on the outermost scrollable/flex container.
 */
export const getContainerStyle = (isLandscape, colors) => ({
  flex: 1,
  backgroundColor: colors.background,
  flexDirection: isLandscape ? "row" : "column",
  alignItems: isLandscape ? "flex-start" : "stretch",
});

/**
 * In landscape, the brand/header column takes up ~38% and stays fixed.
 * In portrait, it's just a normal top section.
 */
export const getBrandColumnStyle = (isLandscape) =>
  isLandscape
    ? {
        width: "38%",
        paddingHorizontal: 32,
        paddingTop: 48,
        paddingBottom: 32,
        alignItems: "center",
        justifyContent: "center",
      }
    : {
        width: "100%",
        alignItems: "center",
        paddingTop: 40,
        paddingBottom: 8,
      };

/**
 * In landscape, the form/content column takes the remaining 62%.
 * In portrait, it takes full width.
 */
export const getFormColumnStyle = (isLandscape) =>
  isLandscape
    ? {
        flex: 1,
        paddingHorizontal: 32,
        paddingVertical: 32,
        justifyContent: "center",
      }
    : {
        width: "100%",
        paddingHorizontal: 24,
        paddingBottom: 32,
      };

/**
 * Max width for form content — keeps it readable on wide screens
 */
export const FORM_MAX_WIDTH = 420;
