// Dark palette — cinematic, warm ink
const Dark = {
  background: "#0f0d0b",
  surface: "#1a1612",
  primary: "#c9943a",
  accent: "#e8d5a3",
  text: "#f0e8dc",
  textMuted: "#6b5e4e",
  border: "#2c231a",
  success: "#5c9e72",
  error: "#b85050",
};

// Light palette — warm parchment, same cinematic soul
const Light = {
  background: "#faf7f2",
  surface: "#f0ebe2",
  primary: "#a67128",
  accent: "#c4943a",
  text: "#1c1410",
  textMuted: "#8a7560",
  border: "#ddd0bc",
  success: "#3d7a52",
  error: "#a03030",
};

export { Dark, Light };

// Default export is dark (used by screens that haven't migrated to getColors yet)
export default Dark;
