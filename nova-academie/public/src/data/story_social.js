// Friendship moments (3 per student), lessons intros, rest scenes, farewells.
export const SOCIAL = {
// ------------------------------------------------------------------ LÉA
social_lea_1: `
@bg chambre
@music bgm_confession
@show lea calme left
narr: Léa est assise en tailleur sur son lit, un carnet couvert de ratures sur les genoux.
lea(gene): Oh, {name}… Tu m'as surprise. Je cherchais une rime à « château ». À part « gâteau » et « bateau »…
> « Là-haut » ? Comme « nos rêves là-haut ». [aff.lea+5 scene+1]
> « Plateau » ! Comme le plateau du prime ! [aff.lea+4 pop+1]
> Et si tu ne faisais pas rimer ? Parfois c'est plus fort. [aff.lea+3 culture+1]
lea(joie): Oh ! C'est parfait. Tu sais que tu as l'âme d'une parolière ? D'un parolier ? Bref, tu as l'âme.
lea: Tu veux bien que je te chante le refrain ? Tu es la première personne à qui je le montre.
narr: Sa voix est fragile au début, puis elle s'envole. Tu as des frissons.
`,
social_lea_2: `
@bg parc
@music bgm_matin
@show lea joie left
narr: Léa t'emmène derrière le château, là où les caméras ne vont presque jamais.
lea(joie): À Quimper, il y a une crêperie où je chantais le jeudi soir. Personne n'écoutait. C'était parfait pour s'entraîner.
lea(triste): Ici, tout le monde écoute. Tout le temps. Parfois, j'ai envie de disparaître.
> Imagine que tu chantes à la crêperie. Juste pour toi. [aff.lea+5 scene+1]
> Les gens écoutent parce que ta voix les touche. C'est un cadeau. [aff.lea+4 pop+1]
> Tu veux qu'on répète ensemble, ici, en cachette ? [aff.lea+5 voix+1]
lea(sourire): Tu es bien plus qu'un binôme de chambre, tu sais.
`,
social_lea_3: `
@bg salon2
@music bgm_chateau
@show lea sourire left
lea(joie): {name} ! Victor a entendu ma chanson. Il veut qu'on la chante au prime ! Enfin… un jour. Peut-être.
lea(gene): Et il a dit que si je la chante, je dois la chanter avec quelqu'un. Et j'ai pensé à toi.
> Avec plaisir ! Ce serait un honneur. [aff.lea+6 pop+2]
> Tu devrais la chanter seule. C'est ta chanson, ton histoire. [aff.lea+4 scene+1]
lea(joie): Tu es la meilleure chose qui me soit arrivée depuis le casting. Avec les crêpes du dimanche.
`,
// ------------------------------------------------------------------ HUGO
social_hugo_1: `
@bg danse
@music bgm_cours
@show hugo joie left
hugo(joie): Viens, je t'apprends le pas qui a fait de moi une légende du quartier de la Belle de Mai !
narr: Hugo enchaîne trois pas, une glissade, et finit par terre en riant.
hugo(gene): Bon, en général ça marche mieux sans parquet ciré.
> (L'aider à se relever et essayer le pas.) [aff.hugo+4 danse+2]
> C'était magnifique. Surtout la chute. [aff.hugo+3 pop+1]
> Tu me montres plus doucement ? Étape par étape ? [aff.hugo+4 danse+2]
hugo: T'as le rythme dans le sang, toi. Un peu caché, mais il est là !
`,
social_hugo_2: `
@bg cuisine
@music bgm_matin
@show hugo neutre left
narr: Hugo s'est mis en tête de cuisiner une bouillabaisse « comme sa mémé ». La cuisine ressemble à un champ de bataille.
hugo(doute): Il manque quelque chose. Du safran ? De l'amour ? Un poisson ?
> Il manque surtout un poisson, Hugo. [aff.hugo+3 pop+1]
> Ça sent bon quand même ! Je goûte ! [aff.hugo+4]
> Je t'aide. Tu épluches, je coupe. [aff.hugo+4]
hugo(joie): Tu sais quoi ? Ma mémé dit que la musique et la cuisine, c'est pareil : il faut goûter, et recommencer.
hugo(gene): Et que si c'est raté, on chante plus fort pour que personne ne remarque.
`,
social_hugo_3: `
@bg piscine
@music bgm_soiree
@show hugo calme left
hugo(calme): Je peux te dire un truc ? Si je pars samedi… je veux que tu gagnes. Pour de vrai.
> Ne dis pas ça. Tu ne pars pas. [aff.hugo+4]
> Si je gagne, tu feras la chorégraphie de mon premier clip. [aff.hugo+5 pop+1]
hugo(joie): Deal ! Et je veux un rôle de figurant aussi. Le beau gosse dans le fond.
`,
// ------------------------------------------------------------------ ZACK
social_zack_1: `
@bg parc
@music bgm_soiree
@show zack neutre left
narr: Zack gratte une guitare électrique débranchée. Le son est ridicule, mais il a l'air concentré.
zack: Qu'est-ce que tu veux ?
> Juste écouter. Tu joues bien. [aff.zack+3]
> T'apprendre à sourire. Ça te changerait. [aff.zack+1 pop+1]
> Tu me montres un riff ? [aff.zack+4 voix+1]
zack: … Assieds-toi. Mais tu touches pas aux mécaniques. Jamais.
`,
social_zack_2: `
@bg salle_musique
@music bgm_cours
@show zack neutre left
zack: Victor m'a encore pris la tête. Il dit que je crie. Moi je dis que je m'exprime.
> Il veut juste que ta voix dure. Tu vas te l'abîmer. [aff.zack+3 voix+1]
> Tu peux crier ET être juste. Montre-lui. [aff.zack+4]
> Peut-être qu'il a un peu raison… [aff.zack+1 scene+1]
zack: … Ouais. Bon. Je vais essayer son exercice de respiration débile. Mais si quelqu'un me voit, je nie tout.
`,
social_zack_3: `
@bg chateau_nuit
@music bgm_confession
@show zack neutre left
narr: Sur le perron, Zack regarde les étoiles. Il te tend un écouteur. C'est du vieux rock, très doux.
zack: Lili adore cette chanson. Elle dit que c'est la musique des gens qui ont du courage.
> Alors c'est ta chanson aussi. [aff.zack+5]
> Elle a une grande sœur… enfin, un grand frère qui assure. [aff.zack+4 pop+1]
zack: Merci, {name}. T'es pas trop nul{|le}, comme élève. Pour une pop star.
`,
// ------------------------------------------------------------------ INÈS
social_ines_1: `
@bg repetition
@music bgm_cours
@show ines neutre left
narr: Inès répète seule dans la salle des miroirs, pour la douzième fois le même passage.
ines: Si tu viens te moquer, la porte est derrière toi.
> Je viens apprendre. Tu es la plus travailleuse d'entre nous. [aff.ines+4 voix+1]
> Je viens répéter aussi. On partage la salle ? [aff.ines+3 danse+1]
> Tu ne te reposes jamais ? [aff.ines+2]
ines: … Bon. Mets-toi là. Et suis le tempo. Pas le tien, le mien.
`,
social_ines_2: `
@bg chambre night
@music bgm_confession
@show ines triste left
narr: Tu entends pleurer derrière la porte de la chambre d'Inès.
ines(triste): Ne regarde pas. Je ne pleure jamais. C'est… allergique.
ines: Mon père dit que si je ne gagne pas, j'aurai perdu deux ans. Que la musique, c'est pour les gagnants.
> Tu as déjà gagné. Tu es ici, et tu es incroyable. [aff.ines+5 pop+1]
> Et toi, qu'est-ce que tu veux, vraiment ? [aff.ines+5 scene+1]
> On a tous la pression. Tu n'es pas seule. [aff.ines+4]
ines(sourire): … Merci. Si tu répètes ça à quelqu'un, je dirai que tu chantes faux.
`,
social_ines_3: `
@bg cafe
@music bgm_matin
@show ines joie left
ines(joie): J'ai une proposition. Quand tout ça sera fini, on fait un duo. Un vrai. Avec un clip, des costumes, tout.
> Marché conclu ! Mais c'est moi qui choisis les costumes. [aff.ines+5 pop+1]
> Toi, me proposer un duo ? Qui es-tu et qu'as-tu fait d'Inès ? [aff.ines+4]
ines(malice): Ne t'habitue pas trop. Sur scène, je reste ta pire rivale.
`,
// ------------------------------------------------------------------ MAËLLE
social_maelle_1: `
@bg jardin
@music bgm_confession
@show maelle calme left
maelle(calme): Tu sais que ce jardin a été dessiné il y a trois cents ans ? Imagine combien d'amoureux se sont promenés ici.
> Et combien de chanteurs ont répété sous ces arbres. [aff.maelle+4 culture+1]
> Tu es une incurable romantique, Maëlle. [aff.maelle+3 pop+1]
maelle(joie): Coupable ! Viens, je te récite du Musset. « On est souvent trompé en amour… »
`,
social_maelle_2: `
@bg theatre
@music bgm_confession
@show maelle sourire left
maelle(sourire): Odile m'a laissé la clé du théâtre. Tu veux jouer une scène avec moi ? Roméo et Juliette !
> Je suis Roméo ! « Elle parle ! Oh ! parle encore, ange resplendissant ! » [aff.maelle+5 scene+2]
> Je préfère jouer le balcon. Je suis très bon en balcon. [aff.maelle+4 pop+1]
maelle(joie): Bravo ! Tu as un vrai talent de tragédien. De tragédienne. De tragé-quelque chose !
`,
social_maelle_3: `
@bg salon2
@music bgm_chateau
@show maelle gene left
@if alive.noah -> here
maelle(gene): Je peux te lire la lettre que j'écris à Noah ? J'ai peur que ce soit trop.
> Lis-la-moi. Je suis sûr{|e} que c'est parfait. [aff.maelle+5]
> Trop, c'est exactement ce qu'il faut en amour. [aff.maelle+4 scene+1]
maelle(joie): « Cher Noah, depuis que tu es parti, les murs chantent moins juste… » Bon, j'en ai écrit six pages.
@end
#here
maelle(gene): J'ai écrit un poème pour Noah. Mais je n'ose pas le lui donner. Il est juste dans la pièce d'à côté…
> Donne-le-lui ce soir. Le courage, c'est maintenant. [aff.maelle+5 scene+1]
> Lis-le-moi d'abord, je te dirai ce que j'en pense. [aff.maelle+4]
maelle(joie): « Toi qui fais chanter le bois de ta guitare… » Oh là là, je rougis rien qu'en le lisant.
`,
// ------------------------------------------------------------------ KENZA
social_kenza_1: `
@bg cuisine
@music bgm_matin
@show kenza joie left
kenza(joie): Assieds-toi. Tu n'as rien mangé ce matin, je t'ai vu{|e}. Un chanteur, ça mange.
> Oui, maman Kenza. [aff.kenza+4 energie+10]
> Je stresse trop pour manger… [aff.kenza+3 energie+10]
kenza: Ma mère me fait chanter depuis que j'ai quatre ans. À l'église, aux mariages, aux anniversaires de tout le quartier.
kenza(sourire): Le jour où je serai sur une vraie scène, elle sera au premier rang avec une pancarte énorme.
`,
social_kenza_2: `
@bg salle_musique
@music bgm_cours
@show kenza serieux left
kenza(serieux): Viens. Je vais te montrer comment on pousse une note soul sans s'arracher la gorge.
narr: Kenza pose ta main sur son ventre. Elle chante une note grave, ronde, puissante. Tu sens tout vibrer.
> Wow. C'est comme un tremblement de terre. [aff.kenza+4 voix+2]
> Je peux essayer ? [aff.kenza+4 voix+2]
kenza(joie): Voilà ! Ça vient d'ici, pas d'ici. Le ventre, pas la gorge. Tu retiens ça et tu chanteras jusqu'à quatre-vingts ans.
`,
social_kenza_3: `
@bg parc
@music bgm_soiree
@show kenza calme left
kenza(calme): Tu sais ce qui me fait le plus peur ? Pas d'être éliminée. Mais de rentrer, et que rien n'ait changé.
> Toi, tu as changé. Ça, personne ne pourra te l'enlever. [aff.kenza+5]
> Tu vas faire une carrière immense, Kenza. [aff.kenza+4 pop+1]
kenza(joie): Toi, tu sais parler aux grandes sœurs. Allez, viens, on va voler des biscuits.
`,
// ------------------------------------------------------------------ NOAH
social_noah_1: `
@bg salon
@music bgm_confession
@show noah calme left
narr: Noah joue de la guitare dans un coin du salon. Il s'arrête quand tu entres.
noah(gene): Désolé. Je ne voulais pas déranger.
> Continue, c'est très beau. [aff.noah+4]
> Tu me laisses chanter dessus ? [aff.noah+5 voix+1]
noah(sourire): C'est une chanson de mon grand-père. Il la chantait en occitan. Je ne connais pas toutes les paroles.
`,
social_noah_2: `
@bg jardin
@music bgm_matin
@show noah neutre left
noah: Maëlle m'a récité un poème ce matin. Pendant vingt minutes. Je n'ai rien compris, mais c'était bien.
> Je crois qu'elle t'aime bien, Noah. [aff.noah+4 aff.maelle+2]
> Tu devrais lui jouer une chanson en retour. [aff.noah+4 scene+1]
noah(gene): Moi ? Mais… je ne sais pas parler aux filles. Ni aux garçons. Ni aux gens en général.
`,
social_noah_3: `
@bg chateau_nuit
@music bgm_confession
@show noah calme left
noah(calme): Je crois que je ne suis pas fait pour la télé. Mais je suis content d'être venu. Grâce à toi, un peu.
> Toi, tu es fait pour la musique. C'est tout ce qui compte. [aff.noah+5]
> Promets-moi de ne jamais arrêter la guitare. [aff.noah+5 pop+1]
noah(sourire): Promis. Même si je pars, je continuerai. Pour les tomates de ma grand-mère.
`,
// ------------------------------------------------------------------ JADE
social_jade_1: `
@bg salon
@music bgm_matin
@show jade triste left
jade(triste): Tu crois que mes abonnés m'oublient ? Ça fait trois jours. Trois JOURS sans poster.
> Ils te voient tous les soirs à la télé, Jade ! [aff.jade+4 pop+1]
> Et toi, tu ne t'ennuies pas de toi-même, sans écran ? [aff.jade+3 scene+1]
jade(joie): … Tu as raison. Bon. Apprends-moi à chanter, alors. Pour de vrai. Pas pour les filtres.
`,
social_jade_2: `
@bg piscine
@music bgm_matin
@show jade sourire left
jade(sourire): Je n'ai jamais dit à personne que je voulais chanter. Mes vidéos, c'était du maquillage. Ici, on ne peut pas tricher.
> C'est pour ça que c'est beau. [aff.jade+4]
> Tu es plus courageuse que tu ne le crois. [aff.jade+5 pop+1]
jade(joie): Si je pars samedi, je ferai une vidéo sur toi. Tu vas avoir des abonnés, je te préviens !
`,
social_jade_3: `
@bg cuisine
@music bgm_soiree
@show jade joie left
jade(joie): Regarde ! J'ai appris à faire un vibrato ! Enfin, je crois que c'est un vibrato. Ou une crise d'éternuements.
> C'était un vibrato. Un vrai. [aff.jade+5 pop+1]
> C'était… très original. [aff.jade+3]
`,
// ------------------------------------------------------------------ SACHA
social_sacha_1: `
@bg cafe
@music bgm_confession
@show sacha calme left
sacha(calme): Thé ? Je ne le fais pas très bien, mais je le sers avec beaucoup de dignité.
> Volontiers. Raconte-moi la Belgique. [aff.sacha+4 culture+1]
> Avec du sucre. Beaucoup de sucre. [aff.sacha+3]
sacha(malice): En Belgique, nous avons trois langues officielles, des centaines de bières et une seule vérité : la frite se cuit deux fois.
`,
social_sacha_2: `
@bg chant
@music bgm_confession
@show sacha serieux left
narr: Sacha est au piano blanc. Il joue un air de Mozart, puis le transforme doucement en tube pop.
sacha(serieux): Tu vois ? Mozart, c'était la pop de son époque. Les gens sifflaient ses airs dans la rue.
> Tu m'apprends ce morceau ? [aff.sacha+4 voix+1 culture+1]
> Tu devrais faire ça au prime ! C'est génial. [aff.sacha+4 pop+1]
sacha(sourire): Peut-être. Si le public belge vote en masse. C'est-à-dire, ma mère.
`,
social_sacha_3: `
@bg salon2
@music bgm_chateau
@show sacha joie left
sacha(joie): J'ai pris une décision. Quand je sortirai d'ici, je ferai de la pop. De la pop baroque. Avec des clavecins.
> Je serai au premier rang de ton concert. [aff.sacha+5]
> « Sacha et ses synthés baroques », c'est un nom de groupe génial. [aff.sacha+5 pop+1]
sacha(malice): Tu seras ma choriste. Tu porteras une perruque poudrée. C'est non négociable.
`,
social_generic: `
@bg salon
@music bgm_chateau
@show $X sourire left
$X(sourire): Merci d'être passé{|e}. Ça fait du bien de parler un peu.
> Je suis là quand tu veux. [aff.$X+4]
`,
// ------------------------------------------------------------------ LESSONS
lesson_chant_1: `
@bg chant
@music bgm_cours
@show victor neutre right
victor: Bonjour ! Vocalises. Do, ré, mi… Le corps d'abord, la voix ensuite. Épaules basses, menton droit.
victor: Chaque note est une syllabe. Pose-la au bon moment, comme une pierre dans un ruisseau.
`,
lesson_chant_2: `
@bg chant
@music bgm_cours
@show victor joie right
victor(joie): Aujourd'hui : les voyelles. A, é, i, o, u. Ce sont elles qui portent la voix. Les consonnes, c'est la décoration.
victor: Ouvre la bouche. Plus. Encore. Voilà, tu ressembles à un poisson. C'est parfait.
`,
lesson_chant_3: `
@bg chant
@music bgm_cours
@show victor neutre right
victor: Exercice de staccato. Des notes courtes, précises, détachées. Ha, ha, ha ! Comme un rire bien placé.
victor: Si tu rates, ce n'est pas grave. Si tu abandonnes, là, c'est grave.
`,
lesson_danse_1: `
@bg danse
@music bgm_cours
@show mia joie right
mia(joie): Échauffement ! On réveille les chevilles, les genoux, les hanches. Cinq, six, sept, huit !
mia: Regarde les flèches, écoute la musique, et surtout : SOURIS ! Une erreur avec le sourire, c'est un style.
`,
lesson_danse_2: `
@bg repetition
@music bgm_cours
@show mia neutre right
mia: Aujourd'hui, du funk. Le groove, c'est dans les genoux. Plie, rebondis, et laisse la basse te porter.
`,
lesson_danse_3: `
@bg danse
@music bgm_cours
@show mia joie right
mia(joie): Chorégraphie électro ! C'est rapide, c'est carré, c'est précis. On compte, on frappe, on brille.
`,
lesson_theatre_1: `
@bg theatre
@music bgm_confession
@show odile serieux right
odile(serieux): Chanter, c'est jouer. Un texte sans intention, c'est une chanson sans mélodie.
odile: Aujourd'hui, on travaille les grands classiques. Trouve l'émotion juste. Et respecte le silence.
`,
lesson_theatre_2: `
@bg theatre
@music bgm_confession
@show odile sourire right
odile(sourire): Bonjour, mes artistes. Le théâtre, c'est oser le ridicule pour atteindre le sublime.
odile: Lis la réplique. Choisis ton intention. Et donne-la-moi, toute entière.
`,
lesson_culture_1: `
@bg bureau
@music bgm_quiz
@show helene neutre right
helene: Un artiste doit connaître ceux qui l'ont précédé. Quiz de culture musicale ! Le plus rapide gagne.
`,
lesson_culture_2: `
@bg bureau
@music bgm_quiz
@show helene neutre right
helene: Chanson française, pop, cinéma, histoire… Une star doit pouvoir répondre à tout en interview. Prêts ?
`,
lesson_souffle_1: `
@bg yoga
@music bgm_chateau
@show mia calme right
mia: Séance de souffle. Inspire par le nez, gonfle le ventre… et laisse la voix sortir, sans forcer.
mia: Le but : garder ta note dans la zone, le plus longtemps possible. C'est ça, l'endurance d'un chanteur.
`,
lesson_souffle_2: `
@bg sport
@music bgm_cours
@show mia joie right
narr: Séance de cardio au gymnase. Mia a mis la musique à fond.
mia(joie): Un chanteur qui s'essouffle au deuxième refrain, c'est un chanteur qui n'est pas venu au sport ! Allez, on tient la note !
`,
repos_1: `
@bg chambre
@music bgm_confession
narr: Tu t'allonges sur ton lit. Le plafond est peint de petits nuages. Tu ne les avais jamais remarqués.
@show $R calme left
$R(calme): Tu fais une sieste ? Bonne idée. Je garde la porte. Personne ne passera.
narr: Tu t'endors en quelques secondes. Tu rêves d'une salle immense qui chante tes chansons.
`,
repos_2: `
@bg piscine_int
@music bgm_confession
narr: La piscine intérieure est déserte. L'eau tiède, le silence, les néons bleus… Ton corps te remercie.
narr: Tu fais la planche et tu fredonnes. L'écho de la pièce rend ta voix immense.
`,
repos_3: `
@bg salon2
@music bgm_chateau
narr: Un plaid, une tisane, la grande baie vitrée qui donne sur le parc. Pendant une heure, personne ne te demande rien.
narr: Tu regardes la pluie tomber et tu te sens, pour la première fois depuis longtemps, parfaitement à ta place.
`,
// ------------------------------------------------------------------ FAREWELLS
farewell_jade: `
@bg prime
@music bgm_triste
@show jade triste center
jade(triste): Bon. Je crois que c'est fini pour moi. Et vous savez quoi ? Je ne regrette rien.
jade: J'ai appris que je n'avais pas besoin d'un filtre pour exister. Merci le château. Merci la promo.
> Jade, tu vas nous manquer ! Garde ton vibrato ! [aff.jade+5 pop+1]
> (La serrer très fort dans tes bras.) [aff.jade+5]
jade(joie): Je vous fais la plus grande story de l'histoire en sortant ! … Si on me rend mon téléphone.
`,
farewell_noah: `
@bg plateau_tv
@music bgm_triste
@show noah triste center
noah(triste): Merci… Je ne suis pas très doué pour les discours. Alors je vais faire comme d'habitude.
narr: Noah prend sa guitare et joue trois accords, très doux. La salle entière se tait.
noah: Prenez soin de Maëlle. Et de {name}. Et de vous.
> Merci pour tout, Noah. Tu es un grand musicien. [aff.noah+5 pop+1]
> On se reverra. À Toulouse, avec les tomates ! [aff.noah+5]
`,
farewell_hugo: `
@bg scene
@music bgm_triste
@show hugo triste center
hugo(triste): Oh là là… Je vais pleurer. Je pleure déjà. C'est la faute aux projecteurs, ça chauffe les yeux.
hugo: J'ai jamais cru que je pourrais chanter devant des gens. Et je l'ai fait. Toutes les semaines.
hugo(joie): Vous allez voir, un jour je danserai sur Broadway et vous me demanderez des autographes !
> Tu es le cœur de cette promo, Hugo. [aff.hugo+5 pop+1]
> Je te réserve une place dans mon premier clip ! [aff.hugo+5]
hugo: Un dernier moonwalk pour la route !
narr: Il recule en glissant jusqu'aux coulisses, sous un tonnerre d'applaudissements.
`,
farewell_sacha: `
@bg prime
@music bgm_triste
@show sacha calme center
sacha(calme): Mesdames et messieurs, je quitte le château la tête haute et le col bien amidonné.
sacha: Je pars en Belgique fonder le premier groupe de pop baroque de l'histoire. Vous êtes tous engagés comme choristes.
> On viendra tous, en perruque poudrée ! [aff.sacha+5 pop+1]
> Tu vas nous manquer, Sacha. Toi et ton humour. [aff.sacha+5]
sacha(sourire): Et souvenez-vous : la frite se cuit deux fois. Comme les rêves.
`,
farewell_maelle: `
@bg plateau_tv
@music bgm_triste
@show maelle triste center
maelle(triste): « Partir, c'est mourir un peu. » … Mais c'est aussi aller retrouver quelqu'un.
maelle(joie): Noah, si tu regardes : je prends le train demain matin. Prépare les tomates.
> Va le rejoindre, Maëlle ! On est trop heureux pour toi ! [aff.maelle+5 pop+1]
> Ton histoire est plus belle qu'une pièce de théâtre. [aff.maelle+5]
`,
farewell_zack: `
@bg prime
@music bgm_triste
@show zack neutre center
zack: Bon. Je suis pas doué pour ça. Alors je vais faire court.
zack: Lili, je t'aime. Et à la promo… merci de m'avoir supporté. Je sais que c'était pas facile.
> Tu es le plus grand cœur du château, Zack. [aff.zack+5 pop+1]
> Fonde ton groupe. On veut te voir sur scène ! [aff.zack+5]
zack: … Rock'n'roll.
`,
farewell_kenza: `
@bg scene
@music bgm_triste
@show kenza triste center
kenza(triste): Maman, je sais que tu es dans la salle. Je te vois avec ta pancarte. Elle est énorme.
kenza(joie): Je rentre à la maison. Mais je rentre différente. Je rentre chanteuse.
kenza: Vous trois : mangez bien, dormez bien, et buvez de l'eau, bon sang !
> Promis, grande sœur ! [aff.kenza+5 pop+1]
> Tu es une chanteuse immense, Kenza. Le monde va t'entendre. [aff.kenza+5]
`,
farewell_lea: `
@bg finale
@music bgm_triste
@show lea triste center
lea(triste): Je… je ne pensais même pas passer le casting. Et je suis arrivée en demi-finale.
lea: Je suis montée sur scène chaque samedi alors que j'avais peur de chanter devant ma propre mère.
lea(sourire): {name}, Inès… allez gagner. Pour moi. Pour la crêperie de Quimper. Pour toute la promo.
> Léa… sans toi, je ne serais jamais arrivé{|e} jusqu'ici. [aff.lea+6 pop+2]
> Ta chanson, je la chanterai un jour. Promis. [aff.lea+6 voix+1]
narr: Léa descend de la scène en courant, mais elle se retourne une dernière fois et te fait un signe. Le même que le jour du casting.
`,
};
