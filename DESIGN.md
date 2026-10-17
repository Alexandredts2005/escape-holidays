# Escape Holidays — Hôtel Les Mirages · Document de conception

Jeu d'évasion 3D à la troisième personne, style dessin animé (cel-shading + contours encrés), dans un palace de vacances
sur une petite île délimitée. Solo (le mode à deux viendra plus tard : un joueur voit l'indice, l'autre agit).

## Histoire
Tu as gagné un « séjour de rêve gratuit » à l'Hôtel Les Mirages. La directrice, **Mme Véronique Pincevent**, a perdu ses
5 étoiles : plus aucun client ne reste. Sa solution : garder le gagnant… pour toujours (« séjour à durée indéterminée »).
Elle a caché les **étoiles d'or** de l'hôtel dans ses pièces : 4 étoiles ouvrent son bureau (« Système Cinq Étoiles »).
**Gustave**, le perroquet de l'hôtel (rationné en biscuits par la directrice), t'aide contre des biscuits.
Fin : dans le bureau, la directrice t'enferme (alarme « Grand Ménage », 3:00). Tu t'échappes par le toboggan secret
jusqu'à la piscine, puis en bateau depuis le ponton.

## Carte (mètres, x = est, z = sud, y = haut)
- Île : x −62..62, z −52..58, mer tout autour (limite naturelle + rochers).
- Hôtel : x −24..24, z −40..−16. RDC y=0 (h 4.2), étage y=4.5 (h 3.6), hall en double hauteur (plafond 9).
  - Hall x −8..8 · porte principale sud (0,−16) · porte Spa ouest (−8,−26) · porte Restaurant est (8,−22)
  - Escalier le long du mur est du hall, mezzanine/couloir x −22..22, z −40..−36 à l'étage.
  - Spa x −24..−8 (RDC ouest) · Restaurant x 8..24, z −28..−16 · Cuisine x 8..24, z −40..−28 (+ chambre froide)
  - Bureau directrice x −22..−8, z −36..−16 (étage ouest) · Suite 7 x 10..22, z −36..−16 (étage est) + balcon
- Parvis z −16..−2 : fontaine (0,−8) et 4 statues · Allée vers le sud · Jardin piscine à l'est · Potager à l'ouest
- Plage z 28..44 · Ponton (0,40)→(0,62) avec le bateau · Phare (−48,38) · Cabines de plage à l'est.

## Chaîne d'énigmes
| # | Lieu | Énigme | Solution | Récompense |
|---|------|--------|----------|------------|
| 0 | Ponton → Hall | Arrivée au coucher du soleil, accueil de la directrice | — | Bracelet « tout compris » |
| S1 | Suite 7 | Douche chaude → buée sur le miroir : « 🦩 🐚 🍍 » = compter les objets de la suite | 4-6-3 (cadenas minibar) | 2 biscuits, cuillère en argent |
| S2 | Suite 7 | Gustave toque au balcon : poser un biscuit devant la chatière | — | Gustave (indices) |
| S3 | Suite 7 | Post-it du coffre : « l'heure de mes réveils : rouge, bleu, vert, jaune » (4 réveils cachés) | 1479 (clavier du coffre) | Étoile 1, clé de secours |
| L1 | Couloir | Partition encadrée « Hymne des Mirages » : Sol Mi Do Mi Ré Sol | — | (indice) |
| L2 | Hall | Piano : jouer l'hymne → le coucou de la réception chante | Sol Mi Do Mi Ré Sol | Clé du hall |
| G1 | Parvis | Plaque : « Le dauphin rêve du grand bleu, la tortue ne pense qu'à la salade, le flamant cherche ses cousins en plastique, le lion ne quitte pas des yeux sa maîtresse » | dauphin S, tortue O, flamant E, lion N | Étoile 2 (la fontaine se vide) |
| G2 | Piscine | Épuisette cadenassée à la chaise du maître-nageur ; « mon cocktail préféré porte le nom de l'hôtel » → ardoise du bar : Mirage = 🍍🥥🍓 | ananas-coco-fraise | Épuisette → repêcher la clé du Spa |
| G3 | Ponton | Jean-Michel le pélican-pie adore ce qui brille | donner la cuillère | Sardine |
| G4 | Potager | Tomate gardée par l'épouvantail | ramasser | Tomate |
| P1 | Spa | Hammam : 3 vannes (eucalyptus, menthe, lavande) ; affiche « Programme Aroma » | 2 · 7 · 5 | La vapeur révèle « Vestiaire : le peignoir de la patronne » |
| P2 | Spa | Vestiaires : peignoir brodé V.P. (leurres P.V., V.R.) sur la patère 9 → casier 9 (bracelet) | casier 9 | Clé du sauna, biscuit |
| P3 | Spa | Sauna ⏱ 2:30 : la porte se verrouille. Planches gravées : « 1 ce qui refroidit, 2 ce qui mouille, 3 ce qui souffle » | ❄️ 💧 🌬️ | Étoile 3, clé du restaurant |
| R1 | Restaurant | Plan de table VIP (logique) : le Baron jamais dos à la mer, la Comtesse à sa droite, le Docteur face à la Comtesse… | voir story.js | Homard joyeux → clé de la cuisine |
| R2 | Cuisine | Chambre froide ⏱ 2:00 : caisses (jour + température) ; « ordre des livraisons » | 5263 | Rouget |
| R3 | Cuisine | Bouillabaisse : recette déchirée en 3 morceaux (oignon, tomate, rouget, sardine) | ordre de la recette | Étoile 4 |
| F1 | Bureau | 4 étoiles dans la porte → la directrice t'enferme ⏱ 3:00 ; coffre aux 4 symboles gravés au dos des étoiles, ordre = tableau | — | Clé du bateau + Étoile 5 |
| F2 | Bureau | Bibliothèque : livre « Comment partir sans payer » → toboggan secret → piscine → ponton → bateau | — | Fin |

## Aides et récompenses
- Indices de Gustave : touche H, 1 biscuit par niveau d'indice (3 niveaux par étape). ~14 biscuits cachés au total.
  Sans biscuit et bloqué depuis 8 min, Gustave donne gratuitement le premier niveau (jamais de blocage total).
- 10 canards dorés cachés → chaque paire débloque 2 tenues (vestiaire).
- Carnet de voyage (J) : tampons par lieu, médaille Or (0 indice) / Argent (≤ 2) / Bronze, temps, indices notés.
