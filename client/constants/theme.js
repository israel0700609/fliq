import { Dark, Light } from "./Colors";

export const getColors = (isDark) => (isDark ? Dark : Light);

export const getContainerStyle = (isLandscape, colors) => ({
  flex: 1,
  backgroundColor: colors.background,
  flexDirection: isLandscape ? "row" : "column",
  alignItems: isLandscape ? "flex-start" : "stretch",
});

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

export const FORM_MAX_WIDTH = 420;
