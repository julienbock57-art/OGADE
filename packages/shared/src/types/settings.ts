export type ThemePreference = "light" | "dark" | "auto";

export type UserSettings = {
  theme?: ThemePreference;
  // Extensible : future préférences (langue, taille de texte, etc.)
};
