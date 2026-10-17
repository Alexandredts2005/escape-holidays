// Weekly scenes: Monday intros, primes, post-prime evenings, confessionals.
export const WEEKS = {
// ------------------------------------------------------------------ WEEK 1
w1_intro: `
@bg cuisine
@music bgm_matin
@title Semaine 1 · Bienvenue au château
narr: Sept heures du matin. Une musique tonitruante résonne dans tous les couloirs : c'est le réveil officiel du château.
@show hugo joie left
@show sacha calme right
hugo(joie): Bonjour la promo ! Qui veut des croissants ? Je les ai pas faits, mais je les ai trouvés, c'est déjà un exploit.
sacha(malice): En Belgique, on appelle ça un vol. Mais je vais en prendre deux, par solidarité.
@show jade triste midleft
jade(triste): J'ai rêvé de mon téléphone. Il vibrait. Je l'ai cherché partout dans mon lit.
> Courage, Jade. Dans une semaine, tu n'y penseras plus. [aff.jade+3]
> Tes abonnés vont te voir à la télé, c'est encore mieux ! [aff.jade+2 pop+1]
> Moi, ça me fait du bien d'être coupé{|e} du monde. [scene+1]
@hideall
@bg bureau
@music bgm_tension
@show helene neutre center
helene: Bonjour à tous. Cette première semaine a pour thème : « Bienvenue au château ».
helene: Samedi, pour le premier prime, vous chanterez tous l'hymne de l'académie, « Le Château des Rêves ».
helene: {name}, c'est toi qui chanteras le premier couplet en solo.
@show ines serieux right
ines(serieux): Pardon ? Dès la première semaine ? On ne la connaît même pas… enfin, on ne le connaît même pas.
helene: Justement. Nous verrons tous de quoi {name} est capable.
> Merci pour votre confiance. Je vais travailler dur. [voix+1 aff.ines-2]
> Inès, si tu veux le chanter, on peut en parler… [aff.ines+3 pop-1]
> (Avaler sa salive.) Le premier couplet… en direct… [scene+1]
helene: Notre invitée de samedi sera la chanteuse Lou Ardent. Je compte sur vous pour être à la hauteur.
@hide ines
helene: Au travail. Victor vous attend en salle de chant, Mia en salle de danse. Choisissez bien vos cours : la semaine passe vite.
`,

w1_prime: `
@bg prime
@music bgm_prime
@sfx jingle_prime
@title Prime 1 · En direct
@show samia joie center pop
samia(joie): Bonsoir la France ! Bienvenue dans le tout premier prime de la nouvelle saison de NOVA Académie !
samia: Ils sont dix, ils ont entre dix-huit et vingt-deux ans, et ils vivent leur rêve depuis une semaine.
samia: Ce soir, pour l'ouverture, ils chantent tous ensemble l'hymne de l'académie : « Le Château des Rêves » !
samia(malice): Et c'est {name} qui ouvre le bal. Pas de pression… à part quatre millions de téléspectateurs.
@sfx applause
@hide samia
narr: Les coulisses sentent la laque et le trac. Léa te serre la main. Hugo fait des étirements bizarres.
@show lea gene left
lea(gene): Tu vas être génial{|e}. Je le sais.
> Merci, Léa. On y va ensemble. [aff.lea+2]
> (Fermer les yeux et respirer profondément.) [energie+5]
narr: Le régisseur compte sur ses doigts. Trois… deux… un…
`,

w1_after: `
@bg salon night
@music bgm_soiree
narr: Retour au château. Le canapé de Jade est vide. Sa brosse à cheveux traîne encore sur la table basse.
@show hugo triste left
@show maelle triste right
hugo(triste): C'est bizarre. Ce matin, elle me volait mes céréales, et ce soir… plus rien.
maelle(triste): Elle a écrit un petit mot sur le miroir de la salle de bain : « Restez vrais. Bisous. Jade. »
@show kenza sourire center
kenza: Bon. On a le droit d'être tristes ce soir. Mais demain, on se relève. Elle aurait voulu ça.
> (Lever son verre de jus d'orange.) À Jade ! [pop+1 aff.kenza+2]
> Elle avait plus de cran qu'on ne le croyait. [aff.maelle+2]
narr: Un à un, les élèves montent se coucher. Il reste huit semaines.
`,

confess_1: `
@bg confessionnal
@music bgm_confession
narr: Le confessionnal. Une petite pièce, un fauteuil, une caméra. Ici, tu parles directement au public.
[Voix de la régie]: Alors, {name}, cette première semaine ? Comment tu te sens au château ?
> Je n'ai jamais été aussi {heureux|heureuse}. Merci de me regarder ! [pop+3]
> C'est dur. Je doute de moi, mais je m'accroche. [pop+2 scene+1]
> Honnêtement ? Certains élèves sont là pour faire le buzz, pas pour chanter. [pop-1 aff.ines+2]
[Voix de la régie]: Un mot pour ta famille ?
> Maman, papa, je fais ça pour vous. [pop+2]
> Gardez-moi une part de gâteau, je rentre… dans neuf semaines ! [pop+2]
narr: Le voyant rouge s'éteint. Tu ressors avec l'impression d'avoir parlé à des millions d'inconnus… et à toi-même.
`,

// ------------------------------------------------------------------ WEEK 2
w2_intro: `
@bg danse
@music bgm_cours
@title Semaine 2 · Semaine danse
@show mia joie center pop
mia(joie): Bonjour mes étoiles ! Cette semaine, c'est MA semaine. Le thème : la danse !
mia: Samedi, vous danserez sur « Danse avec moi ». Je veux de l'énergie, de la précision et des sourires jusqu'aux oreilles.
mia: Et nos invités seront Les Kinetic, le crew de danseurs le plus célèbre du pays.
@show hugo joie left
hugo(joie): LES KINETIC ?! Je les regarde en boucle depuis mes douze ans ! Je vais mourir. Je vais mourir de bonheur.
@show noah gene right
noah(gene): Moi je vais mourir tout court. Je danse comme une chaise pliante.
> Noah, je t'aiderai à répéter, promis. [aff.noah+4 danse+1]
> Hugo, tu nous donnes des cours du soir ? [aff.hugo+3 danse+1]
> Une chaise pliante, c'est déjà mieux qu'une armoire ! [aff.noah+2 pop+1]
mia: Cinq, six, sept, huit ! On commence par l'échauffement. Et on ne se plaint pas !
@hideall
@bg cuisine night
@music bgm_soiree
@show noah triste left
narr: Le soir, tu trouves Noah seul dans la cuisine, une lettre à la main.
noah(triste): C'est ma grand-mère. Elle m'écrit que le jardin est plein de tomates et qu'elle ne sait pas quoi en faire sans moi.
noah: Je suis content d'être là, mais… Toulouse me manque. Ma guitare me manque. Le silence me manque.
> C'est normal d'avoir le mal du pays. On est ta famille ici, maintenant. [aff.noah+4]
> Écris-lui une chanson. Sur ses tomates. [aff.noah+3 scene+1]
> Tu dois te concentrer, Noah. Sinon tu vas être nommé. [aff.noah-1 danse+1]
noah(sourire): … Merci, {name}. Tu es la première personne à qui j'en parle.
`,

w2_prime: `
@bg plateau_tv
@music bgm_prime
@sfx jingle_prime
@title Prime 2 · Semaine danse
@show samia joie center pop
samia(joie): Bonsoir et bienvenue dans le deuxième prime de NOVA Académie ! Ce soir, on danse !
samia: Nos élèves ont travaillé toute la semaine avec Mia Kowalski… et avec nos invités, Les Kinetic !
@sfx applause_big
samia(malice): {name}, on nous a dit que tu avais fait des progrès spectaculaires. Montre-nous ça !
@hide samia
@show mia joie right
mia(joie): Souris. Compte dans ta tête. Et si tu te perds, fais semblant que c'était voulu !
`,

w2_after: `
@bg chambre night
@music bgm_triste
narr: Noah est parti. Avant de monter dans la voiture, il t'a laissé quelque chose.
narr: Un médiator. Rouge. Avec un mot gravé au couteau : « Pour les soirs de silence. »
@show lea triste left
lea(triste): Il jouait tous les soirs dans le salon. Je crois que je vais avoir du mal à m'endormir sans sa guitare.
> On pourra jouer à sa place. Tu m'apprends ? [aff.lea+3 voix+1]
> Il va faire une belle carrière, j'en suis sûr{|e}. [pop+1]
lea(sourire): D'accord. Mais je te préviens : je suis une prof très sévère.
`,

confess_2: `
@bg confessionnal
@music bgm_confession
[Voix de la régie]: {name}, la semaine danse a été intense. Tu t'en sors comment ?
> J'ai mal partout, mais je n'ai jamais autant progressé ! [pop+2 danse+1]
> Hugo est incroyable. Il mériterait de gagner. [pop+2 aff.hugo+2]
> La danse, ce n'est pas mon truc. Je suis là pour chanter. [pop-2 voix+1]
[Voix de la régie]: Et Noah ? On dit que vous êtes proches.
> C'est un ami précieux. Il a un cœur immense. [pop+2 aff.noah+2]
> On parle souvent le soir. Il a besoin qu'on le soutienne. [pop+1]
`,

// ------------------------------------------------------------------ WEEK 3
w3_intro: `
@bg salle_musique
@music bgm_matin
@title Semaine 3 · Semaine émotion
@show victor neutre center
victor: Cette semaine, on arrête de faire du bruit et on commence à faire de la musique.
victor: Le thème, c'est l'émotion. Votre chanson du prime : « Lumière ». Une ballade. Pas de chorégraphie pour vous cacher.
victor: Notre invitée, Camille Rives, vient spécialement pour vous faire travailler l'interprétation.
@show hugo gene left
hugo(gene): Une ballade… Moi qui chante comme une mouette en colère…
victor: Hugo, une mouette en colère a au moins le mérite d'être sincère. Travaille.
@hide victor
@show lea sourire right
lea(gene): {name}… Je peux te montrer quelque chose ? J'ai écrit une chanson cette nuit. Sur le château. Sur nous.
> Bien sûr ! Chante-la-moi. [aff.lea+4 scene+1]
> Tu devrais la montrer à Victor ! [aff.lea+2 pop+1]
lea(joie): Elle s'appelle « Les murs qui chantent ». C'est un peu bête…
narr: Elle fredonne, à peine audible. C'est tout sauf bête. C'est magnifique.
@hideall
@bg piscine
@music bgm_soiree
@show hugo triste left
narr: L'après-midi, tu trouves Hugo assis au bord de la piscine, les pieds dans l'eau.
hugo(triste): Tu sais pourquoi je danse ? Parce que quand je danse, personne n'écoute ma voix.
hugo: Et cette semaine, on me demande de chanter « Lumière ». Toute seule, ma voix. Toute nue.
> Ta voix est belle parce qu'elle est à toi. N'essaie pas de la cacher. [aff.hugo+4]
> On va répéter ensemble, jusqu'à ce que tu y croies. [aff.hugo+4 voix+1]
> Peut-être qu'il faut accepter de ne pas être bon partout. [aff.hugo+1 scene+1]
hugo(sourire): T'es une perle, {name}. Une vraie perle de Marseille. Même si t'es pas de Marseille.
`,

w3_prime: `
@bg scene
@music bgm_prime
@sfx jingle_prime
@title Prime 3 · Semaine émotion
@show samia sourire center pop
samia(sourire): Bonsoir à tous. Ce soir, on sort les mouchoirs.
samia: Nos élèves vont interpréter des ballades, accompagnés par la sublime Camille Rives.
samia: {name} va nous chanter « Lumière ». Une chanson sur l'attente, l'espoir… et la lumière qui revient toujours.
@sfx applause
@hide samia
narr: La salle est plongée dans le noir. Un seul projecteur. Un seul micro. Toi.
`,

w3_after: `
@bg salon night
@music bgm_triste
narr: Le départ d'Hugo a laissé le château plus silencieux que jamais. Même les couloirs semblent tristes.
@show kenza triste left
@show zack neutre right
kenza(triste): Il faisait rire tout le monde. Même les caméras, je suis sûre.
zack: … Il m'a appris le moonwalk. Je ne le dirai à personne d'autre que vous. Jamais.
> Zack qui fait le moonwalk… Je veux voir ça ! [aff.zack+3 pop+1]
> Hugo va revenir. En comédie musicale, je vous le promets. [aff.kenza+2]
zack(neutre): … Peut-être un jour. Pour lui.
narr: Sur la porte du frigo, Hugo a collé un dessin : dix bonshommes qui dansent. Il a barré le sien et écrit « je vous regarde ! ».
`,

confess_3: `
@bg confessionnal
@music bgm_confession
[Voix de la régie]: Cette semaine, beaucoup d'émotions. Qu'est-ce qui t'a touché{|e} le plus ?
> La chanson que Léa a écrite. Elle a un talent fou. [pop+2 aff.lea+3]
> Hugo. Il a eu le courage de chanter sans se cacher. [pop+2 aff.hugo+3]
> Moi-même. J'ai découvert que je pouvais faire pleurer une salle. [pop+1 scene+2]
[Voix de la régie]: Tu as déjà pleuré, ici ?
> Tous les soirs, sous la couette. [pop+3]
> Jamais devant les caméras. [pop-1 scene+1]
`,

// ------------------------------------------------------------------ WEEK 4
w4_intro: `
@bg plateau_tv
@music bgm_cours
@title Semaine 4 · Semaine électro-pop
@show helene neutre center
helene: Cette semaine, nous accueillons NÉON, le duo électro qui fait danser toute l'Europe.
helene: Votre chanson du prime : « Ma ville la nuit ». Des synthés, des néons, une ville qui ne dort jamais.
@show sacha doute right
sacha(doute): Des synthétiseurs. Moi qui ai passé huit ans à chanter du Mozart dans une église glaciale.
sacha(malice): Remarquez, l'Auto-Tune, c'est un peu comme l'écho d'une église. En plus moderne. Et en moins froid.
@show ines joie left
ines(joie): Enfin une semaine pour moi. L'électro, c'est mon terrain de jeu.
> Inès, tu veux bien me montrer ta technique ? [aff.ines+4 voix+1]
> On verra bien sur scène qui est sur son terrain. [pop+1 aff.ines-1]
> Sacha, ton lyrique pourrait être génial sur de l'électro ! [aff.sacha+3 scene+1]
ines(sourire): … Tu sais quoi ? Je veux bien. Mais tu ne le répètes à personne.
@hideall
@bg cafe
@music bgm_soiree
@show sacha calme left
narr: Le soir, Sacha t'invite pour un « thé de crise » au petit café du château.
sacha(calme): Je vais te confier un secret. Je ne suis pas sûr de vouloir être une pop star.
sacha: Ma mère voulait que je chante à l'opéra. Moi, je voulais juste… chanter. Sans costume. Sans perruque.
> Alors chante pour toi, pas pour ta mère, ni pour le public. [aff.sacha+4 scene+1]
> Et pourquoi pas mélanger les deux ? Opéra et pop ! [aff.sacha+3 voix+1]
sacha(sourire): Opéra-pop. « Sacha et ses synthés baroques ». J'aime bien. C'est absurde, donc c'est belge.
`,

w4_prime: `
@bg prime
@music bgm_prime
@sfx jingle_prime
@title Prime 4 · Semaine électro-pop
@show samia malice center pop
samia(malice): Bonsoir ! Ce soir, on éteint les lumières et on allume les néons !
samia: Accueillez NÉON !
@sfx applause_big
samia: Et maintenant, {name} nous emmène dans « Ma ville la nuit » !
@hide samia
narr: Les lasers balaient la salle. Les basses te font vibrer la poitrine. Le public est debout.
`,

w4_after: `
@bg cuisine night
@music bgm_soiree
narr: Sacha est parti en saluant comme un chanteur d'opéra, une révérence jusqu'au sol.
@show maelle triste left
@show kenza neutre right
maelle(triste): Il m'a laissé sa recette de gaufres de Liège. Avec une note : « Ne jamais, JAMAIS mettre de Nutella. C'est un crime. »
kenza(sourire): On va en faire demain matin. Avec du Nutella. Pour l'embêter.
> Avec du Nutella, évidemment. [pop+1 aff.kenza+2]
> Non ! Respectons ses dernières volontés ! [aff.maelle+3]
narr: Six élèves. La moitié de la promo. Le château semble soudain immense.
`,

confess_4: `
@bg confessionnal
@music bgm_confession
[Voix de la régie]: On t'a vu{|e} répéter avec Inès. Vous êtes amis maintenant ?
> Elle est exigeante, mais elle me tire vers le haut. [pop+2 aff.ines+3]
> Je garde mes amis proches… et mes rivales encore plus proches. [pop+1 scene+1]
> C'est une stratégie. Je ne lui fais pas confiance. [pop-2 aff.ines-3]
[Voix de la régie]: Ton souvenir préféré du château, pour l'instant ?
> Les soirées guitare dans le salon. [pop+2]
> Le premier prime, quand le public a crié mon prénom. [pop+2 voix+1]
`,

// ------------------------------------------------------------------ WEEK 5
w5_intro: `
@bg piscine
@music bgm_matin
@title Semaine 5 · Semaine latino
@show mia joie center pop
mia(joie): Hola, mis estrellas ! Cette semaine, on chauffe le château : c'est la semaine latino !
mia: Rafa Solé, la star du reggaeton, sera notre invité. Et votre titre du prime : « Soleil d'octobre ».
mia: Des hanches, des sourires, de la sueur. Beaucoup de sueur.
@show maelle sourire left
maelle(sourire): La danse latine… C'est du théâtre avec les hanches. J'adore.
@show zack neutre right
zack: Moi, mes hanches sont faites pour headbanguer. Pas pour onduler.
> Allez, Zack, une petite salsa ? [aff.zack+2 danse+1]
> Maëlle, tu me montres tes pas ? [aff.maelle+3 danse+1]
mia: Zack, si tu ondules bien cette semaine, je te laisse chanter du rock la semaine prochaine. Marché conclu ?
zack: … Marché conclu.
@hideall
@bg jardin
@music bgm_confession
@show maelle triste left
narr: Dans le jardin, Maëlle relit pour la dixième fois une lettre.
maelle(triste): Noah m'a écrit. Il dit qu'il regarde tous les primes. Qu'il… qu'il pense à moi.
maelle: Je crois que je suis amoureuse d'un garçon qui est à 600 kilomètres. C'est très romantique et très nul à la fois.
> C'est magnifique ! Tu dois lui répondre. [aff.maelle+4]
> Chante-lui « Soleil d'octobre » samedi. Il comprendra. [aff.maelle+3 scene+1]
> Concentre-toi sur l'aventure, Maëlle. L'amour attendra. [aff.maelle-1 danse+1]
maelle(joie): Tu as raison. Je vais lui écrire. En alexandrins, évidemment.
`,

w5_prime: `
@bg plateau_tv
@music bgm_prime
@sfx jingle_prime
@title Prime 5 · Semaine latino
@show samia joie center pop
samia(joie): ¡Buenas noches ! Bienvenue dans le prime le plus chaud de la saison !
samia: Accueillez Rafa Solé !
@sfx applause_big
samia: Et pour faire monter la température, {name} sur « Soleil d'octobre » !
@hide samia
`,

w5_after: `
@bg jardin night
@music bgm_triste
narr: Maëlle est partie en récitant un poème de Musset à la caméra. Toute l'équipe a applaudi.
@show lea triste left
lea(triste): Elle m'a dit qu'elle allait prendre le train pour Toulouse dès demain. Pour voir Noah.
lea(sourire): Au moins, une histoire d'amour qui commence. Ça console un peu.
@show kenza sourire right
kenza: Cinq. On n'est plus que cinq. Je vous préviens : je ne pleurerai plus. … D'accord, peut-être un peu.
> (Faire un câlin collectif.) [pop+2 aff.kenza+2 aff.lea+2]
> On tient bon. Ensemble jusqu'au bout. [pop+1]
`,

confess_5: `
@bg confessionnal
@music bgm_confession
[Voix de la régie]: Mi-saison ! Si tu pouvais changer une chose au château, ce serait quoi ?
> Rien. Même les réveils à sept heures, je les aime. [pop+2]
> Rendre leurs guitares à tout le monde le soir ! [pop+2]
> Moins de caméras dans la salle de bain ! [pop+3]
[Voix de la régie]: Tu penses aller jusqu'en finale ?
> J'y crois. Chaque jour un peu plus. [pop+2 voix+1]
> Je vis chaque semaine comme si c'était la dernière. [pop+2 scene+1]
> Évidemment. Les autres ne sont pas à mon niveau. [pop-3]
`,

// ------------------------------------------------------------------ WEEK 6
w6_intro: `
@bg salle_musique
@music bgm_cours
@title Semaine 6 · Semaine rock
@show zack neutre center pop
zack: C'est ma semaine. Enfin.
@show victor neutre right
victor: Ton thème, Zack, oui. Mais ta voix, elle, a encore besoin de travail. Arrête de hurler. Chante.
zack: Le rock, c'est hurler !
victor: Le rock, c'est être sincère. On peut hurler et mentir. On peut chuchoter et dire la vérité.
@hide victor
narr: Zack sort en claquant la porte. Le titre du prime, « Ne lâche rien », n'a jamais aussi bien porté son nom.
@hideall
@bg parc
@music bgm_confession
@show zack neutre center
narr: Tu retrouves Zack dans la cour, assis sur une table de pique-nique.
zack: Tu sais pourquoi je chante ? Ma petite sœur, Lili. Elle a été longtemps à l'hôpital, l'an dernier.
zack: Je lui chantais des chansons de rock à voix basse, pour pas réveiller les autres patients. Elle disait que c'était son super-pouvoir.
zack: Elle va mieux maintenant. Et elle regarde le prime chaque samedi. Je veux qu'elle soit fière.
> Alors chante samedi comme tu chantais à l'hôpital. Doucement, et vrai. [aff.zack+5 scene+1]
> Elle est déjà fière. Ça se voit dans tes yeux quand tu parles d'elle. [aff.zack+4]
> Il faut le dire à Victor. Il comprendrait. [aff.zack+2 pop+1]
zack: … Ne raconte ça à personne. Enfin… sauf si ça peut m'aider à chanter.
narr: C'est la première fois que tu vois Zack sourire. Un vrai sourire. Ça lui va bien.
`,

w6_prime: `
@bg prime
@music bgm_prime
@sfx jingle_prime
@title Prime 6 · Semaine rock
@show samia malice center pop
samia(malice): Bonsoir ! Ce soir, sortez les blousons de cuir : c'est le prime rock !
samia: Accueillez Les Brûlants !
@sfx applause_big
samia: {name}, à toi de nous prouver qu'il ne faut jamais rien lâcher !
@hide samia
narr: Dans les coulisses, Zack te tape dans la main, si fort que ça pique. « Fais-les trembler. »
`,

w6_after: `
@bg salon night
@music bgm_soiree
narr: Zack est parti en levant le poing vers la caméra. Puis il a murmuré : « Lili, je t'aime. »
@show kenza triste left
@show lea triste right
@show ines neutre center
kenza(triste): Il avait un cœur gros comme ça, sous ses clous et son cuir.
ines: … Il m'a dit que j'étais la pire diva qu'il ait jamais rencontrée. Puis il m'a donné son bracelet.
ines(triste): Je ne sais pas comment je dois le prendre.
> Je crois que c'est sa façon de dire qu'il t'aime bien. [aff.ines+3 pop+1]
> Zack, c'était le plus doux d'entre nous. [aff.kenza+2 aff.lea+2]
narr: Quatre élèves. Quatre chaises autour de la grande table. Et une semaine des duos qui s'annonce.
`,

confess_6: `
@bg confessionnal
@music bgm_confession
[Voix de la régie]: Zack t'a fait des confidences. Tu veux en parler ?
> Non. Ce qu'il m'a dit lui appartient. [pop+3 aff.zack+3]
> Il fait ça pour sa petite sœur. C'est beau. [pop+1 aff.zack-1]
[Voix de la régie]: Plus que quatre élèves. Qui te fait le plus peur ?
> Inès. Elle est redoutable sur scène. [pop+1 aff.ines+2]
> Léa. Sa sincérité est imbattable. [pop+1 aff.lea+2]
> Moi-même. Mon pire ennemi, c'est le doute. [pop+3 scene+1]
`,

// ------------------------------------------------------------------ WEEK 7
w7_intro: `
@bg bureau
@music bgm_matin
@title Semaine 7 · Semaine des duos
@show helene neutre center
helene: Cette semaine : les duos. Samedi, nous accueillerons Élise et Marco, le duo le plus célèbre de la chanson française.
helene: Vous chanterez « Deux voix ». Et pour une fois, vous choisirez vous-mêmes votre partenaire.
@show lea gene left
@show ines neutre right
narr: Léa te regarde avec espoir. Inès fait semblant de ne pas regarder. Mais elle regarde.
> Je choisis Léa. Depuis le casting, c'est elle. [aff.lea+6 aff.ines-2 flag.duo=1]
> Je choisis Inès. Nos deux voix ensemble, ça peut être explosif. [aff.ines+6 aff.lea-2 flag.duo=2]
> Je propose qu'on le chante à trois ! Avec Kenza, à quatre ! [aff.kenza+3 aff.lea+2 aff.ines+2 pop+2 flag.duo=3]
helene: Va pour ce choix. Au travail, vous avez cinq jours.
@hideall
@bg cuisine night
@music bgm_soiree
@show kenza calme center
narr: Tard le soir, Kenza prépare une tisane pour toute la maison.
kenza(calme): Tu sais, je suis l'aînée de cinq. À la maison, c'est moi qui fais les devoirs avec les petits, qui fais à manger…
kenza: Ici, c'est la première fois de ma vie que je ne m'occupe que de moi. Et je ne sais pas faire.
> Alors laisse-nous nous occuper de toi, pour une fois. [aff.kenza+5]
> Tu es la grande sœur de tout le château. On te doit tellement. [aff.kenza+4 pop+1]
kenza(joie): Arrête, tu vas me faire pleurer dans la tisane. Et la tisane, c'est sacré.
`,

w7_prime: `
@bg scene
@music bgm_prime
@sfx jingle_prime
@title Prime 7 · Semaine des duos
@show samia sourire center pop
samia(sourire): Bonsoir ! Ce soir, on chante à deux. Parce qu'une voix, c'est beau… mais deux voix, c'est magique.
samia: Accueillez Élise et Marco !
@sfx applause_big
@if flag.duo==1 -> lea
@if flag.duo==2 -> ines
samia: Et maintenant, toute la promo réunie autour de {name}, pour « Deux voix » !
@end
#lea
samia: Et maintenant, le duo que tout le monde attendait : {name} et Léa, pour « Deux voix » !
@show lea joie left
lea(joie): Comme au casting. Sauf qu'on a moins peur. Un peu moins.
@end
#ines
samia: Et maintenant, un duo explosif : {name} et Inès, pour « Deux voix » !
@show ines malice right
ines(malice): Essaie de suivre, d'accord ?
`,

w7_after: `
@bg salon night
@music bgm_triste
narr: Kenza est partie. Avant de franchir les grilles, elle a fait promettre aux trois derniers de bien manger, bien dormir et « boire de l'eau, bon sang ».
@show lea triste left
@show ines triste right
lea(triste): On n'est plus que trois. Je n'arrive pas à y croire.
ines: Demi-finale. Deux chansons. Un orchestre. Et un seul ticket de sortie.
> Quoi qu'il arrive, je suis {fier|fière} de nous trois. [aff.lea+3 aff.ines+3 pop+1]
> Que le meilleur gagne. On se doit ça. [voix+1]
`,

confess_7: `
@bg confessionnal
@music bgm_confession
[Voix de la régie]: Ton duo de la semaine, c'était un choix du cœur ou un choix stratégique ?
> Du cœur. Toujours du cœur. [pop+3]
> Un peu des deux, je l'avoue. [pop+1 scene+1]
[Voix de la régie]: Si tu gagnes, quelle est la première chose que tu feras ?
> Appeler ma famille. Puis dormir trois jours. [pop+2]
> Écrire un album sur ces semaines au château. [pop+2 voix+1]
> Offrir une tournée à toute la promo ! [pop+3]
`,

// ------------------------------------------------------------------ WEEK 8
w8_intro: `
@bg finale
@music bgm_tension
@title Semaine 8 · Demi-finale
@show helene neutre center
helene: Vous êtes trois. Trois sur dix. Je suis fière de chacun d'entre vous.
helene: Samedi, vous chanterez avec l'Orchestre National. Deux titres chacun : une ballade, « Mille étoiles », et une chorégraphie sur « Feu d'artifice ».
helene: Le public votera. Deux d'entre vous iront en finale.
@hide helene
@show lea inquiet left
@show ines serieux right
ines(serieux): Je ne vais pas faire semblant : je veux cette finale. Plus que tout.
lea(triste): Moi aussi… Mais j'ai l'impression d'avoir déjà gagné quelque chose. Je chante devant des gens, maintenant. Moi.
> Léa, tu as une place en finale autant que nous. [aff.lea+4]
> Inès, ton envie, c'est ta force. Moi, c'est ma promesse. [aff.ines+3 voix+1]
> Arrêtons de parler de la finale. Profitons de chaque note. [pop+2 scene+1]
@hideall
@bg chambre night
@music bgm_confession
@show lea calme left
lea(calme): {name}… Tu te souviens, le premier soir ? Tu m'as demandé si on allait tenir neuf semaines.
lea(sourire): On a tenu. Enfin, presque. Quoi qu'il arrive samedi, je voulais te dire merci.
> C'est moi qui te remercie, Léa. Tu as été mon phare. [aff.lea+5]
> Ne dis pas ça comme un adieu. On va en finale ensemble. [aff.lea+3 pop+1]
lea: Je t'ai écrit une dernière chanson. Tu l'écouteras… après. D'accord ?
`,

w8_prime: `
@bg finale
@music bgm_prime
@sfx jingle_prime
@title Prime 8 · Demi-finale
@show samia joie center pop
samia(joie): Bonsoir et bienvenue dans la demi-finale de NOVA Académie !
samia: Ce soir, l'Orchestre National accompagne nos trois derniers élèves. Et à la fin de l'émission, nous connaîtrons nos deux finalistes.
@sfx applause_big
samia: {name}, à toi d'ouvrir la soirée avec « Mille étoiles ».
@hide samia
narr: Soixante musiciens accordent leurs instruments. Le chef d'orchestre te fait un clin d'œil.
`,

w8_after: `
@bg chambre night
@music bgm_triste
narr: Léa est partie. Sa moitié de la chambre est vide. Sur ton oreiller, un CD gravé, avec écrit au feutre : « Pour après. »
narr: Tu le glisses dans le vieux lecteur du salon. Sa voix s'élève, douce, un peu tremblante.
[Léa (enregistrement)]: « Tu m'as appris à chanter devant les gens. Maintenant, va chanter devant le monde entier. Je serai au premier rang. »
> (Essuyer une larme… puis sourire.) [pop+2 voix+2]
> (Murmurer :) Merci, Léa. Je vais le faire pour nous deux. [pop+3]
narr: Une semaine. Une chanson. Une finale.
`,

confess_8: `
@bg confessionnal
@music bgm_confession
[Voix de la régie]: Demi-finale, {name}. Comment tu te sens ?
> Épuisé{|e}… et plus vivant{|e} que jamais. [pop+3]
> J'ai peur. Mais la peur, c'est du carburant. [pop+2 scene+1]
[Voix de la régie]: Un message pour Léa et Inès ?
> Vous êtes les deux plus belles rencontres de ma vie. [pop+2 aff.lea+2 aff.ines+2]
> Que le public choisisse avec son cœur. [pop+2]
`,

// ------------------------------------------------------------------ WEEK 9
w9_intro: `
@bg chateau_jour
@music bgm_matin
@title Semaine 9 · La Grande Finale
narr: Le château a changé. Il est trop calme. Trop grand. Il n'y a plus que deux brosses à dents dans la salle de bain.
@show ines neutre right
ines: Bonjour, finaliste.
> Bonjour, finaliste. [aff.ines+2]
> On a réussi. Tu te rends compte ? [aff.ines+3 pop+1]
ines(sourire): Tu sais que je ne voulais pas d'amis en arrivant ici ? Je voulais juste gagner.
ines: Et maintenant… je ne sais même pas si je veux te battre. C'est ridicule.
@hideall
@bg hall
@music bgm_prime
@show helene neutre center
helene: Une surprise pour vous deux. Pour votre dernière semaine, quelques visages familiers sont revenus…
@show hugo joie farleft
@show kenza joie left
@show zack neutre right
@show lea joie farright
hugo(joie): SURPRIIIISE ! On est venus vous aider à répéter ! Et manger tout le frigo !
kenza(joie): Et vérifier que vous buvez de l'eau. Vous buvez de l'eau ?
zack: Lili te passe le bonjour. Elle a fait un dessin de toi. Tu as une très grosse tête dessus.
lea(joie): On est tous là pour la finale. Toute la promo sera sur scène avec vous samedi.
> Vous m'avez tellement manqué ! [pop+3 aff.hugo+2 aff.kenza+2 aff.zack+2 aff.lea+2]
> Alors au travail, la promo ! Une dernière fois ! [pop+2 voix+1]
helene: Votre chanson de finale s'appelle « La Dernière Scène ». Faites-en le plus beau moment de votre vie.
`,

w9_prime: `
@bg finale
@music bgm_prime
@sfx jingle_prime
@title La Grande Finale
@show samia joie center pop
samia(joie): Bonsoir la France ! Ce soir, c'est LA soirée. La grande finale de NOVA Académie !
samia: Toute la promo est réunie, nos professeurs sont dans la salle, et des millions de téléspectateurs sont devant leur écran.
@sfx applause_big
samia: Inès vient de nous offrir une prestation époustouflante. Le public est debout.
samia: Et maintenant… pour la dernière fois sur cette scène… {name} !
@hide samia
narr: Tu montes les marches. Les visages de toute la promo brillent dans la pénombre. Léa lève le pouce. Hugo pleure déjà.
narr: Tu fermes les yeux. Tu revois le casting, la file d'attente, la première nuit. Et tu ouvres la bouche.
`,

confess_9: `
@bg confessionnal
@music bgm_confession
[Voix de la régie]: Dernier passage au confessionnal, {name}. Qu'est-ce que tu veux dire au public ?
> Merci. Sans vous, rien de tout ça n'existerait. [pop+4]
> Quoi qu'il arrive samedi, je continuerai à chanter. Toujours. [pop+3 voix+1]
> Votez pour moi ! … Et pour Inès aussi, elle le mérite. [pop+3 aff.ines+3]
narr: Le voyant rouge s'éteint pour la dernière fois. Tu restes un moment assis{|e} dans le fauteuil, à sourire tout{|e} seul{|e}.
`,
};
