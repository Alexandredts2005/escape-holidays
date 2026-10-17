#!/bin/bash
# Double-clic sur Mac (ou ./Lancer-le-jeu.command sur Linux) : lance le serveur et ouvre le jeu.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé. Télécharge-le sur https://nodejs.org puis relance ce fichier."
  (open https://nodejs.org || xdg-open https://nodejs.org) >/dev/null 2>&1
  read -r -p "Appuie sur Entrée pour fermer."
  exit 1
fi
echo "Lancement du jeu... le navigateur va s'ouvrir. Garde cette fenêtre ouverte pendant que tu joues."
node server.js --open
