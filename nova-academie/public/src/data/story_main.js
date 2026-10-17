// Prologue, system scenes (nominations, votes, verdicts), endings.
export const MAIN = {
prologue: `
@bg plateau_tv
@music bgm_menu
@title NOVA Académie — Le grand casting
narr: Paris, un matin de septembre. Devant les studios, la file d'attente fait le tour du pâté de maisons.
narr: Des guitares, des cahiers de paroles, des mamans qui recoiffent, des cœurs qui battent trop vite.
narr: Toi aussi, tu es là. Tu as rêvé de ce jour dans ta chambre, devant ton miroir, une brosse à cheveux en guise de micro.
@show samia sourire center pop
samia(joie): Bonjour à toutes et à tous, et bienvenue au grand casting de NOVA Académie !
samia: Cette année encore, dix élèves vont entrer au château. Neuf semaines de cours, de doutes, de fous rires…
samia(malice): … et chaque samedi, un prime en direct où le public décidera de leur sort.
samia: À la fin, une seule étoile. Un contrat d'album, une tournée, et une vie qui change.
@hide samia
@show lea gene left
lea(gene): Euh… pardon. C'est bien ici, la file pour les auditions ? J'ai l'impression d'être perdue depuis six heures du matin.
> Oui, c'est ici ! Tu as le trac, toi aussi ? [aff.lea+3]
> Je crois… mais je suis aussi perdu{|e} que toi ! [aff.lea+2]
> C'est ici. Et prépare-toi : je compte bien gagner. [aff.lea-2 pop+1]
lea(joie): Moi c'est Léa. Je viens de Quimper. J'ai écrit des dizaines de chansons… et je n'en ai jamais chanté une seule devant quelqu'un.
player: Moi c'est {name}. On va s'en sortir, tu verras.
@show ines neutre right
ines: Des dizaines de chansons et zéro public ? C'est mignon.
ines(joie): Moi, j'ai fait la première partie de quatre tournées. Inès, de Lyon. Retenez bien ce prénom, vous allez l'entendre souvent.
@hide ines
lea(triste): Elle est… impressionnante.
> Laisse-la parler. Ici, c'est la voix qui compte, pas l'ego. [aff.lea+3]
> Elle a peut-être raison sur un point : il va falloir assurer. [scene+1]
> Moi aussi, je veux qu'on retienne mon prénom. [pop+1 aff.lea-1]
lea: Bonne chance, {name}. Vraiment.
@hideall
@bg scene
@music stop
narr: « {name} ? » Ton prénom résonne dans le couloir. C'est ton tour.
narr: Un plateau immense, des projecteurs, et trois silhouettes derrière une table.
@show helene neutre midleft
@show victor neutre midright
helene: Bonjour. Je suis Hélène Marchal, la directrice de NOVA Académie. Voici Victor Delmas, notre professeur de chant.
victor: On ne te demande pas d'être parfait{|e}. On te demande d'être vrai{|e}.
victor: Tu vas nous chanter « Premier Pas ». Écoute la musique, respire, et lance-toi.
> Je suis prêt{|e}. [pop+1]
> Je… je vais faire de mon mieux. [scene+1]
> J'attends ce moment depuis toujours. [voix+1]
helene: Alors montre-nous. Quand tu veux.
`,

audition_result: `
@bg scene
@music bgm_confession
@show helene neutre midleft
@show victor neutre midright
@if var.score>=85 -> great
@if var.score>=60 -> good
victor: Hmm. La voix tremblait. Le rythme se cherchait…
helene: Mais il y avait quelque chose. Une envie. Et l'envie, ça ne s'apprend pas.
victor: Le reste, oui. Ça s'apprend. C'est même mon métier.
@goto verdict
#good
victor(joie): Pas mal du tout ! Quelques notes à placer, mais quelle présence.
helene: On sent que tu as travaillé. Et que tu as encore beaucoup à apprendre. C'est exactement ce qu'on cherche.
@goto verdict
#great
@sfx applause_small
victor(joie): … Wow. Je n'ai rien à dire. Et je ne dis jamais ça.
helene: Tu as donné des frissons à toute l'équipe technique. Même le cadreur a applaudi.
@stat pop+3
#verdict
helene: {name}, j'ai le plaisir de t'annoncer que tu fais partie des dix élèves de la nouvelle saison de NOVA Académie.
@flash
@sfx jingle_victoire
@confetti
> C'est pas vrai ! Merci, merci, merci ! [pop+2]
> (Rester sans voix… et fondre en larmes.) [scene+2]
> Je ne vous décevrai pas. [voix+1]
victor(joie): Rendez-vous lundi soir au château. Et dors bien : là-bas, on se lève tôt.
helene: Et n'oublie pas : le public te regardera vingt-quatre heures sur vingt-quatre. Reste toi-même.
`,

arrivee: `
@bg chateau_nuit
@music bgm_chateau
@title Lundi soir · Le château
narr: Une voiture remonte lentement l'allée bordée de buis. Au bout, le château s'illumine comme un décor de film.
narr: Derrière les grilles, des fans crient des prénoms qu'ils ne connaissent pas encore. Le tien, peut-être.
@show hugo joie right
hugo(joie): Eh ! Toi aussi tu fais partie de la promo ? Hugo, de Marseille ! Danseur de rue, chanteur de salle de bain !
> Enchanté{|e}, Hugo ! Moi c'est {name}. [aff.hugo+3]
> Danseur de rue ? Tu me montreras quelques pas ? [aff.hugo+4 danse+1]
> Chanteur de salle de bain… ça promet. [aff.hugo+1 pop+1]
hugo: Allez, viens, il paraît que les autres sont déjà dans le hall. J'ai entendu dire qu'il y a une piscine. Une PISCINE !
@hideall
@bg hall
@show lea joie left
@show kenza sourire midleft
@show zack neutre midright
@show sacha calme right
lea(joie): {name} ! Tu as été pris{|e} aussi ! Je savais que tu y arriverais.
kenza(joie): Oh, une nouvelle tête ! Viens là. Moi c'est Kenza, Saint-Denis. Ici, on se serre les coudes, d'accord ?
zack: Zack. Lille. Je fais du rock. Je ne fais pas de câlins.
sacha(malice): Sacha. De Liège. J'ai fait huit ans de chant lyrique, donc je vous préviens : je chante faux exprès pour paraître normal.
@hideall
@show maelle sourire left
@show noah calme midleft
@show jade joie midright
@show ines neutre right
maelle(sourire): Maëlle, de Nantes. Je crois que cet endroit a une âme. Vous ne sentez pas ? Ces murs ont entendu tant de chansons…
noah(gene): Noah. Toulouse. Je joue de la guitare. Voilà.
jade(joie): Et moi c'est Jade ! Deux cent mille abonnés ! Faites un selfie avec moi, il faut que je poste ça avant qu'on nous prenne nos…
ines(malice): … téléphones ? Tu n'as pas lu le règlement, chérie ?
jade(surprise): Pardon ?
@hideall
@show helene neutre center pop
@music bgm_tension
helene: Bonsoir à tous. Bienvenue chez vous pour les neuf prochaines semaines.
helene: Les règles sont simples. Chaque jour, des cours : chant avec Victor, danse avec Mia, théâtre avec Odile.
helene: Le mercredi, les évaluations. Les professeurs nommeront les trois élèves les plus fragiles de la semaine.
helene: Vous, les élèves, voterez pour sauver l'un d'entre eux. Les deux autres affronteront le vote du public au prime du samedi.
helene: Et le samedi soir, celui ou celle que le public n'aura pas choisi quittera le château.
@sfx bong
helene: Enfin, vos téléphones. Dans cette boîte. Maintenant.
@show jade triste right
jade(triste): Mais… mais mes abonnés ! Mes stories !
helene: Vos abonnés vous verront à la télévision, mademoiselle. C'est mieux qu'une story, non ?
@hide jade
helene: Les chambres sont à l'étage. {name}, tu partageras la tienne avec Léa.
@hideall
@bg chambre night
@music bgm_confession
@show lea calme left
lea(gene): Alors… c'est notre chambre. C'est fou. Ce matin j'étais dans le train, et ce soir je dors dans un château.
> Tu crois qu'on va tenir neuf semaines ? [aff.lea+2]
> On va vivre les plus belles semaines de notre vie. [aff.lea+3 pop+1]
> Je ne suis pas là pour dormir. Je suis là pour gagner. [aff.lea-1 voix+1]
lea(sourire): Tu sais quoi ? Je suis contente que ce soit toi, mon binôme.
lea: Bonne nuit, {name}. Demain, la vraie aventure commence.
narr: Tu fixes le plafond longtemps. Quelque part en bas, quelqu'un joue doucement de la guitare. Noah, sans doute.
narr: Tu t'endors avec une mélodie dans la tête.
`,

eval_generic: `
@bg salle_musique
@music bgm_cours
@show victor neutre midleft
@show mia neutre midright
victor: Mercredi, jour des évaluations. Vous connaissez la règle : on vous écoute, on note, on ne fait pas de cadeau.
mia: Respirez. Souriez. Et si vous vous trompez, continuez. Le public ne remarque pas une erreur, il remarque un abandon.
> (Prendre une grande inspiration.) [energie+5]
> Je suis prêt{|e}, on y va ! [pop+1]
victor: {name}, à toi.
`,

nomin_intro: `
@bg bureau
@music bgm_tension
@show helene neutre center
narr: Le soir des évaluations, tous les élèves sont réunis dans le grand salon de la directrice. Personne ne parle.
helene: Les professeurs ont délibéré. Je vais vous lire vos notes… puis les noms des élèves nommés cette semaine.
helene: Quoi qu'il arrive ce soir, souvenez-vous : être nommé, ce n'est pas être mauvais. C'est avoir une semaine pour se battre.
@if var.score>=80 -> high
@if var.score<55 -> low
@goto end
#high
narr: Tu as obtenu {@score}/100. Victor te fait un petit signe de tête. Chez lui, c'est presque une ovation.
@goto end
#low
narr: Tu as obtenu {@score}/100. Tu sens ton estomac se nouer.
`,

nomin_player: `
@bg bureau
@music bgm_triste
@show helene neutre center
helene: {name}, {@A} et {@B}. Vous êtes les trois nommés de la semaine.
@hide helene
@show $A inquiet left
@show $B triste right
narr: Le silence tombe sur le salon. Tu entends ton propre cœur.
@if aff.lea>=25 -> leacomfort
@goto choice
#leacomfort
@show lea triste center
lea(triste): {name}… on va voter pour toi. Je te le promets.
@hide lea
#choice
> (Serrer la mâchoire.) Je vais me battre. Ils vont voir. [voix+2 pop+1]
> (Sourire malgré tout.) Ça va aller. On se bat tous les trois. [pop+2 aff.kenza+2]
> C'est injuste. J'ai tout donné. [pop-2 scene+1]
narr: Demain, les élèves voteront pour sauver l'un de vous trois. Le soir, tu as du mal à trouver le sommeil.
`,

nomin_safe: `
@bg bureau
@music bgm_tension
@show helene neutre center
helene: Les trois élèves nommés cette semaine sont… {@A}…
@sfx bong
helene: … {@B}…
@sfx bong
helene: … et {@C}.
@hide helene
narr: Tu n'es pas nommé{|e}. Le soulagement te coupe les jambes, puis la culpabilité arrive aussitôt.
@show $A triste left
@show $B inquiet midright
$A: … Bon. Il fallait bien que ça tombe sur quelqu'un.
> (Aller les serrer dans tes bras.) [aff.$A+3 pop+1]
> Vous allez tout déchirer samedi. [aff.$B+2]
> (Rester en retrait, sans rien dire.)
narr: Demain, c'est à toi et aux autres élèves de choisir qui sauver. Le choix ne sera pas facile.
`,

semi_nomin: `
@bg bureau
@music bgm_tension
@show helene neutre center
helene: Nous voici en demi-finale. Il n'y a plus de nominations : vous êtes tous les trois face au public.
@show lea inquiet left
@show ines serieux right
helene: Samedi, deux d'entre vous iront en finale. Le troisième quittera le château… en ayant parcouru un chemin magnifique.
lea(triste): Tous les trois… Ça fait bizarre, hein ?
ines: Que la meilleure ou le meilleur gagne. Sans rancune.
> Quoi qu'il arrive, on restera amis. [aff.lea+3 aff.ines+3 pop+1]
> Je vais tout donner. Je ne retiendrai rien. [voix+2]
`,

final_nomin: `
@bg bureau
@music bgm_tension
@show helene neutre center
helene: La finale. Plus de notes, plus de nominations. Samedi, c'est le public, et lui seul, qui couronnera la nouvelle étoile de NOVA Académie.
@show ines neutre right
ines: Toi et moi. Je l'avais dit dès le casting : retiens bien mon prénom.
> Je ne l'ai jamais oublié. Et toi, retiens le mien. [pop+2]
> On en a fait, du chemin, {tous les deux|toutes les deux}. [aff.ines+4]
ines(joie): … Bonne chance, {name}. Pour de vrai.
`,

vote_saved_player: `
@bg salon2
@music bgm_chateau
@show lea joie left
@show kenza joie right
narr: Tes camarades t'ont sauvé{|e}. Tu ne passeras pas devant le public cette semaine.
kenza(joie): Tu croyais vraiment qu'on allait te laisser tomber ?
> Merci… Je ne sais pas quoi dire. [aff.kenza+3 aff.lea+3]
> Je vous revaudrai ça, promis. [pop+1]
narr: Samedi, ce sont {@A} et {@B} qui affronteront le vote du public.
`,

vote_player_public: `
@bg salon2
@music bgm_triste
narr: Les élèves ont sauvé {@S}. Samedi, tu affronteras le vote du public face à {@A}.
@show $A inquiet right
$A: On se retrouve sur scène, alors. Que le public décide.
> Que le meilleur gagne. Sans rancune. [pop+1 aff.$A+2]
> Je ne compte pas partir. [voix+1]
narr: Ce soir, chaque répétition compte double.
`,

vote_after: `
@bg salon2
@music bgm_chateau
narr: Les élèves ont sauvé {@S}. Samedi, {@A} et {@B} affronteront le vote du public.
@show $S joie center
$S(joie): Merci… merci à tous. Je ne vais pas vous décevoir.
@hide $S
narr: Dans le salon, l'ambiance est étrange : on se réjouit pour l'un, on a peur pour les autres.
`,

prime_generic: `
@bg prime
@music bgm_prime
@show samia joie center pop
samia(joie): Bonsoir et bienvenue dans le prime de NOVA Académie !
samia: Ce soir, nos élèves vont tout donner sur scène. Et à la fin de l'émission, l'un d'eux quittera le château.
`,

prime_verdict_intro: `
@bg prime
@music bgm_tension
@show samia serieux center
samia: Les lignes de vote sont maintenant fermées.
samia: Je demande aux nommés de me rejoindre sur le devant de la scène.
narr: Les projecteurs se braquent sur vous. Dans la salle, on retient son souffle.
`,

final_verdict_intro: `
@bg finale
@music bgm_tension
@show samia serieux center
samia: Le moment est venu. Des millions de votes ont été comptabilisés.
@show ines inquiet right
samia: Inès, {name}… vous avez été extraordinaires. Mais il ne peut y avoir qu'une seule étoile.
narr: Tu prends la main d'Inès. Elle serre la tienne, très fort.
`,

semi_second_song: `
@bg prime
@show samia joie center
samia(joie): Et ce n'est pas fini ! Pour ce deuxième titre, {name} nous offre une chorégraphie explosive sur « Feu d'artifice » !
@sfx applause
`,

gameover: `
@bg cuisine night
@music bgm_triste
@show helene neutre center
helene: {name}… Le public a parlé. Ce soir, ton aventure à NOVA Académie s'arrête.
helene: Tu n'as pas à avoir honte. Tu es arrivé{|e} ici avec un rêve, et tu repars avec une voix. Une vraie.
narr: Les élèves t'entourent. Quelqu'un pleure. Quelqu'un chante doucement le refrain du château.
> Revivre ce prime (rejouer la performance) -> retry
> Recommencer cette semaine depuis le lundi -> week
> Quitter le château (retour au menu) -> quit
#retry
@set choice retry
narr: Et si tout pouvait se rejouer… Le rideau se relève.
@end
#week
@set choice week
narr: Retour au lundi matin. Cette fois, tu sais ce qui t'attend.
@end
#quit
@set choice quit
narr: Les grilles du château se referment derrière toi. Mais une chanson ne s'arrête jamais vraiment.
`,

ending_victoire: `
@bg finale
@music bgm_generique
@show samia joie center pop
samia(joie): Le public de NOVA Académie a choisi… {name} !
@flash
@confetti
@sfx applause_big
@hide samia
@show player joie center pop
narr: Tout explose. Les lumières, les cris, les confettis qui tombent comme une neige dorée.
narr: Tu ne sens plus tes jambes. Quelqu'un te tend un trophée en forme d'étoile.
@show ines sourire right
ines(joie): Félicitations. Tu le mérites. Vraiment. … Mais je veux une revanche au premier festival venu.
@show lea joie left
lea(joie): {name} ! Tu as gagné ! On a gagné ! Je savais, je savais depuis le casting !
@hideall
@bg chateau_nuit
@music bgm_chateau
@show helene neutre midleft
@show victor joie midright
helene: Un contrat d'album, une tournée des Zéniths, et une place dans l'histoire de cette école.
victor(joie): Et pas une seule fausse note ce soir. Bon… presque pas.
helene: Prends soin de cette voix, {name}. Et n'oublie jamais d'où tu viens.
> Je n'oublierai jamais ce château. Ni vous. [pop+5]
> Le premier album s'appellera « Premier Pas ». [voix+5]
@hideall
@bg chambre night
narr: Le dernier soir, tu retournes une dernière fois dans ta chambre. Sur ton lit, un carnet t'attend.
narr: Une chanson. Écrite à la main. Signée de tous les élèves de la promo.
narr: Tout en bas, une phrase : « Pour notre étoile. Merci d'avoir été toi. »
@title Fin · Tu es la nouvelle étoile de NOVA Académie
`,

ending_finaliste: `
@bg finale
@music bgm_triste
@show samia serieux center
samia: Le public de NOVA Académie a choisi… Inès !
@flash
@sfx applause_big
@hide samia
@show ines joie right pop
narr: Inès porte les mains à son visage. Puis, avant même de saluer le public, elle court vers toi et te serre dans ses bras.
ines(triste): Sans toi, je ne serais jamais allée aussi loin. Tu m'as rendue meilleure. Cette étoile est un peu la tienne.
@show player sourire left
> Tu la mérites. Profite, c'est ton moment. [pop+3 aff.ines+5]
> La prochaine fois, c'est moi ! [pop+1]
@hideall
@bg chateau_nuit
@music bgm_chateau
@show helene neutre midleft
@show victor joie midright
helene: {name}, ne fais pas cette tête. Tu sais combien de finalistes ont fait de plus grandes carrières que les gagnants ?
victor(joie): Un producteur m'a déjà appelé. Deux, en fait. Prépare tes valises… et tes cordes vocales.
helene: Ce n'est pas une fin. C'est un premier pas. Tu connais la chanson.
@hideall
@bg parc
narr: Le lendemain matin, devant les grilles, des centaines de fans scandent ton prénom.
narr: Tu n'as pas gagné le trophée. Mais tu as gagné quelque chose de plus rare : un public qui t'attend.
@title Fin · Finaliste de NOVA Académie — et ce n'est qu'un début
`,

farewell_generic: `
@bg prime
@music bgm_triste
@show $X triste center
$X(triste): Merci pour tout. Je n'oublierai jamais cette aventure.
`,

after_generic: `
@bg salon night
@music bgm_soiree
narr: De retour au château, tout le monde est épuisé. Une chaise vide à la table du dîner rappelle que l'aventure est cruelle.
`,
};
