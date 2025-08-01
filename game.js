// Point d'entrée principal du jeu (simplifié pour le pack initial)
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game-root");
  root.innerHTML = `<h1>Chargement de la fourmilière...</h1>`;

  // Ici on chargera tous les modules du jeu, initialisation, boucles, musiques, etc.

  // Placeholder audio pour vérification
  const audio = document.createElement("audio");
  audio.src = "audio/Main theme.wav";
  audio.loop = true;
  audio.volume = 0.5;
  audio.play();
});
