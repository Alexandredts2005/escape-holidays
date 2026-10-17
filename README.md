# Escape Holidays — Hôtel Les Mirages

Jeu d'évasion (escape game) en **3D**, vue à la troisième personne, style **dessin animé** (cel-shading + contours encrés),
dans un palace de vacances sur une petite île. On incarne un personnage 3D qui explore librement l'hôtel, les jardins, la
piscine et la plage, ramasse des objets, relève des indices et résout des énigmes **intégrées au décor 3D** (pas de
mini-jeux 2D) pour ouvrir pièce après pièce… jusqu'à l'évasion finale, quand la directrice t'enferme dans son bureau.

- Moteur : [three.js](https://threejs.org) (WebGL), collisions [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh), sans étape de build.
- Graphismes : modèles 3D low-poly CC0 de [Kenney](https://kenney.nl) convertis en matériaux « toon », textures peintes
  procédurales, post-process d'encrage (silhouettes + plis), étalonnage chaud. Très léger : ~50 Mo au total.
- Musique originale générée par les outils du dépôt (`tools/music.py`), bruitages CC0.
- Tout le texte et les dialogues sont en français.

## L'histoire

Tu as gagné un « séjour de rêve tous frais payés » à l'Hôtel Les Mirages. La directrice, **Mme Véronique Pincevent**, a
perdu les cinq étoiles de son hôtel… et a trouvé la solution : garder son gagnant **pour toujours**. Au réveil, ta porte
est verrouillée de l'extérieur. Heureusement, **Gustave**, le perroquet de l'hôtel (renvoyé pour gourmandise), connaît
tous les secrets de la maison… contre des biscuits.

## Contenu

| Lieu | Énigmes (extraits) |
|------|--------------------|
| Suite 7 | douche → miroir embué, minibar à cadenas, 4 réveils cachés, coffre-fort, chatière du perroquet |
| Grand Hall | partition de l'hymne, boîte à musique, piano jouable, coucou, Marcel le veilleur qui parle en dormant |
| Jardins & piscine | statues-gardiennes à orienter, cocktail-code du maître-nageur, clé au fond de la piscine, pélican troqueur |
| Spa Bulles de Rêve | vannes du hammam (programme du jour), peignoirs brodés → casier, **sauna chronométré** |
| Le Homard Joyeux | plan de table VIP (logique), **chambre froide chronométrée**, bouillabaisse en 4 ingrédients |
| Bureau de la directrice | porte à 4 étoiles, **enfermement « Grand Ménage » (3:00)**, coffre à symboles, bibliothèque secrète, toboggan |

- **Aides limitées** : touche **H**, Gustave donne 3 niveaux d'indice par énigme, chacun coûte un biscuit (16 biscuits
  cachés dans le jeu). Si tu es bloqué longtemps sans biscuit, il te fait crédit d'un premier indice.
- **Récompenses** : étoiles d'or qui se rallument sur l'enseigne, tampons et médailles (or / argent / bronze selon les
  indices utilisés) dans le **carnet de voyage** (J), **10 canards dorés** cachés qui débloquent 12 tenues au vestiaire.
- **Chronomètres** : sauna (2:30), chambre froide (2:00), Grand Ménage (3:00). Un échec n'est jamais définitif : tu te
  réveilles un peu plus loin, Gustave te vanne, et tu retentes.
- Sauvegarde automatique (localStorage), reprise de partie, options (volumes, sensibilité, qualité, contours).

## Commandes

| Action | Clavier / souris |
|--------|------------------|
| Se déplacer | ZQSD (AZERTY) ou WASD (QWERTY), flèches |
| Courir / sauter | Maj / Espace |
| Regarder | souris (clic dans la fenêtre pour verrouiller le pointeur) ou glisser |
| Interagir / dialogue suivant | E (ou Entrée) |
| Manipuler un mécanisme | clic gauche (clic droit = sens inverse sur les molettes) |
| Indice de Gustave | H |
| Carnet de voyage | J |
| Pause / quitter un gros plan | Échap |

Tactile : moitié gauche de l'écran = déplacement, moitié droite = caméra, appui bref = interagir.

## Lancer le jeu

Le jeu est un site **100 % statique** (dossier `public/`).

```bash
npm start            # serveur intégré sans dépendance → http://localhost:8080
# ou n'importe quel serveur statique :
python3 -m http.server 8080 -d public
```

### Déployer

- **N'importe quel hébergeur statique** (Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3…) : publier le dossier `public/`.
- **Docker** :
  ```bash
  docker build -t escape-holidays .
  docker run -p 8080:8080 escape-holidays
  ```

### Test automatique de bout en bout

`tools/playtest.cjs` lance le jeu dans Chromium sans écran et le **termine entièrement** en résolvant chaque énigme via
les vrais objets interactifs (intro, 24 étapes, 10 canards, fin) en vérifiant qu'aucune erreur ne survient.

```bash
npm start &            # ou python3 -m http.server 8080 -d public
npm test               # nécessite Playwright (npm i playwright && npx playwright install chromium)
```

## Structure

```
public/
  index.html, style.css          interface (HUD, dialogues, menus) en HTML/CSS
  src/main.js                    cœur du jeu : boucle, modes, menus, indices, sauvegardes
  src/engine/                    rendu toon + encrage, caméra, physique capsule/BVH, joueur, audio, UI
  src/game/hotel.js              structure de l'hôtel (façades, étages, portes, escalier, enseigne)
  src/game/areas/*.js            une pièce = un fichier : décor + énigmes + indices associés
  src/game/story.js              intro, objectifs, échelle d'indices, tampons, fin
  assets/models/                 modèles Kenney (CC0) en .glb + catalog.json (boîtes englobantes)
  assets/music, sfx, fonts, ui   sons, musiques, polices, images d'interface
tools/                           génération de la musique et des images, tests headless
DESIGN.md                        document de conception (carte, chaîne d'énigmes, solutions)
nova-academie/                   ancien prototype (archivé)
```

## Feuille de route

- **Mode à deux** : un joueur voit les indices, l'autre manipule les mécanismes (énigmes asymétriques). Le découpage
  « une pièce = un module » et l'état centralisé (`State`) sont prévus pour être synchronisés en réseau.
- Nouvelles ailes de l'hôtel (blanchisserie, mini-golf des pirates, phare).

## Crédits

Voir [CREDITS.md](CREDITS.md).
