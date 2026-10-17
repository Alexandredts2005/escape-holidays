// Public-domain theatre excerpts used by the theatre lessons.
// emo: colere | joie | tristesse | peur | amour | ironie | fierte | surprise ; w = word hidden in the memory test
export const THEATRE = [
  {
    id: 'cid', title: 'Le Cid', author: 'Pierre Corneille', year: 1637,
    intro: 'Corneille, c\'est l\'honneur et la passion. Chaque vers est une épée.',
    lines: [
      { who: 'Don Diègue', text: 'Rodrigue, as-tu du cœur ?', emo: 'colere', w: 'cœur', alt: ['courage', 'temps'] },
      { who: 'Rodrigue', text: 'Tout autre que mon père l\'éprouverait sur l\'heure.', emo: 'fierte', w: 'père', alt: ['frère', 'maître'] },
      { who: 'Don Diègue', text: 'Ô rage ! ô désespoir ! ô vieillesse ennemie !', emo: 'colere', w: 'désespoir', alt: ['espoir', 'tristesse'] },
      { who: 'Rodrigue', text: 'Je suis jeune, il est vrai ; mais aux âmes bien nées, la valeur n\'attend point le nombre des années.', emo: 'fierte', w: 'valeur', alt: ['victoire', 'sagesse'] },
      { who: 'Chimène', text: 'Va, je ne te hais point.', emo: 'amour', w: 'hais', alt: ['quitte', 'fuis'] },
      { who: 'Rodrigue', text: 'Nous partîmes cinq cents ; mais par un prompt renfort, nous nous vîmes trois mille en arrivant au port.', emo: 'fierte', w: 'renfort', alt: ['effort', 'vent'] },
    ],
  },
  {
    id: 'cyrano', title: 'Cyrano de Bergerac', author: 'Edmond Rostand', year: 1897,
    intro: 'Cyrano, c\'est le panache ! Joue avec le sourire au coin de l\'épée.',
    lines: [
      { who: 'Cyrano', text: 'Ah ! non ! c\'est un peu court, jeune homme !', emo: 'ironie', w: 'court', alt: ['long', 'doux'] },
      { who: 'Cyrano', text: 'C\'est un roc !… c\'est un pic !… c\'est un cap ! Que dis-je, c\'est un cap ?… C\'est une péninsule !', emo: 'ironie', w: 'péninsule', alt: ['montagne', 'colline'] },
      { who: 'Cyrano', text: 'Mais on ne se bat pas dans l\'espoir du succès ! Non ! non, c\'est bien plus beau lorsque c\'est inutile !', emo: 'fierte', w: 'inutile', alt: ['facile', 'utile'] },
      { who: 'Cyrano', text: 'Un baiser, mais à tout prendre, qu\'est-ce ? Un serment fait d\'un peu plus près, une promesse plus précise.', emo: 'amour', w: 'serment', alt: ['secret', 'sourire'] },
      { who: 'Cyrano', text: 'À la fin de l\'envoi, je touche !', emo: 'fierte', w: 'touche', alt: ['chante', 'tombe'] },
      { who: 'Cyrano', text: 'Il y a malgré vous quelque chose que j\'emporte… Mon panache.', emo: 'tristesse', w: 'panache', alt: ['chapeau', 'courage'] },
    ],
  },
  {
    id: 'avare', title: 'L\'Avare', author: 'Molière', year: 1668,
    intro: 'Harpagon, c\'est la comédie du corps entier. N\'aie pas peur d\'en faire trop !',
    lines: [
      { who: 'Harpagon', text: 'Au voleur ! au voleur ! à l\'assassin ! au meurtrier ! Justice, juste Ciel ! je suis perdu, je suis assassiné !', emo: 'peur', w: 'voleur', alt: ['secours', 'menteur'] },
      { who: 'Harpagon', text: 'Hélas ! mon pauvre argent, mon pauvre argent, mon cher ami ! on m\'a privé de toi.', emo: 'tristesse', w: 'argent', alt: ['enfant', 'chien'] },
      { who: 'Harpagon', text: 'Sans dot !', emo: 'joie' },
      { who: 'Valère', text: 'Il faut manger pour vivre, et non pas vivre pour manger.', emo: 'fierte', w: 'vivre', alt: ['rire', 'dormir'] },
      { who: 'Harpagon', text: 'Ah ! que cela est bien dit ! Approche, que je t\'embrasse pour ce mot.', emo: 'joie', w: 'embrasse', alt: ['remercie', 'félicite'] },
      { who: 'Harpagon', text: 'Qui est-ce ? Arrête. Rends-moi mon argent, coquin !', emo: 'colere', w: 'coquin', alt: ['voisin', 'gamin'] },
    ],
  },
  {
    id: 'moliere', title: 'Molière en fête', author: 'Molière', year: '1665-1673',
    intro: 'Un florilège de Molière ! Chaque personnage a sa couleur, trouve-la.',
    lines: [
      { who: 'M. Jourdain', text: 'Par ma foi ! il y a plus de quarante ans que je dis de la prose sans que j\'en susse rien.', emo: 'surprise', w: 'prose', alt: ['musique', 'poésie'] },
      { who: 'Géronte', text: 'Que diable allait-il faire dans cette galère ?', emo: 'colere', w: 'galère', alt: ['guerre', 'rivière'] },
      { who: 'Toinette', text: 'Le poumon, le poumon, vous dis-je.', emo: 'ironie', w: 'poumon', alt: ['cœur', 'foie'] },
      { who: 'Alceste', text: 'Je veux qu\'on soit sincère, et qu\'en homme d\'honneur, on ne lâche aucun mot qui ne parte du cœur.', emo: 'fierte', w: 'sincère', alt: ['sévère', 'fidèle'] },
      { who: 'Sganarelle', text: 'Mes gages ! mes gages ! mes gages !', emo: 'tristesse', w: 'gages', alt: ['pages', 'cages'] },
      { who: 'M. Jourdain', text: 'Apprenez-moi l\'orthographe.', emo: 'joie', w: 'orthographe', alt: ['géographie', 'astronomie'] },
    ],
  },
  {
    id: 'racine', title: 'Grandes tragédies', author: 'Racine & Corneille', year: '1640-1677',
    intro: 'La tragédie, c\'est la retenue. Le feu est dedans, pas dehors.',
    lines: [
      { who: 'Phèdre', text: 'Je le vis, je rougis, je pâlis à sa vue ; un trouble s\'éleva dans mon âme éperdue.', emo: 'amour', w: 'rougis', alt: ['souris', 'partis'] },
      { who: 'Oreste', text: 'Pour qui sont ces serpents qui sifflent sur vos têtes ?', emo: 'peur', w: 'serpents', alt: ['oiseaux', 'enfants'] },
      { who: 'Bérénice', text: 'Pour jamais ! Ah, Seigneur ! songez-vous en vous-même combien ce mot cruel est affreux quand on aime ?', emo: 'tristesse', w: 'cruel', alt: ['doux', 'nouveau'] },
      { who: 'Le vieil Horace', text: 'Qu\'il mourût !', emo: 'colere' },
      { who: 'Auguste', text: 'Soyons amis, Cinna, c\'est moi qui t\'en convie.', emo: 'fierte', w: 'amis', alt: ['frères', 'rivaux'] },
      { who: 'Phèdre', text: 'Ce n\'est plus une ardeur dans mes veines cachée : c\'est Vénus tout entière à sa proie attachée.', emo: 'peur', w: 'proie', alt: ['joie', 'croix'] },
    ],
  },
  {
    id: 'romantiques', title: 'Les Romantiques', author: 'Hugo, Musset, Marivaux, Beaumarchais', year: '1730-1838',
    intro: 'De Marivaux à Hugo : l\'amour, la révolte, l\'esprit. Sois sincère !',
    lines: [
      { who: 'Ruy Blas', text: 'Bon appétit, messieurs ! Ô ministres intègres ! Conseillers vertueux ! voilà votre façon de servir, serviteurs qui pillez la maison !', emo: 'colere', w: 'appétit', alt: ['courage', 'voyage'] },
      { who: 'Perdican', text: 'On est souvent trompé en amour, souvent blessé et souvent malheureux ; mais on aime.', emo: 'amour', w: 'blessé', alt: ['aimé', 'pressé'] },
      { who: 'Perdican', text: 'J\'ai souffert souvent, je me suis trompé quelquefois, mais j\'ai aimé. C\'est moi qui ai vécu.', emo: 'fierte', w: 'vécu', alt: ['perdu', 'vaincu'] },
      { who: 'Silvia', text: 'Ah ! je vois clair dans mon cœur.', emo: 'joie', w: 'clair', alt: ['loin', 'faux'] },
      { who: 'Figaro', text: 'Je me presse de rire de tout, de peur d\'être obligé d\'en pleurer.', emo: 'ironie', w: 'pleurer', alt: ['chanter', 'partir'] },
      { who: 'Figaro', text: 'Vous vous êtes donné la peine de naître, et rien de plus.', emo: 'ironie', w: 'naître', alt: ['paraître', 'connaître'] },
    ],
  },
  {
    id: 'shakespeare', title: 'Shakespeare', author: 'William Shakespeare (trad. F.-V. Hugo)', year: '1595-1603',
    intro: 'Shakespeare, c\'est le monde entier sur une scène. Ose les grands sentiments.',
    lines: [
      { who: 'Hamlet', text: 'Être, ou ne pas être, c\'est là la question.', emo: 'tristesse', w: 'question', alt: ['passion', 'raison'] },
      { who: 'Juliette', text: 'Ô Roméo ! Roméo ! pourquoi es-tu Roméo ?', emo: 'amour', w: 'pourquoi', alt: ['comment', 'quand'] },
      { who: 'Richard III', text: 'Un cheval ! un cheval ! mon royaume pour un cheval !', emo: 'peur', w: 'royaume', alt: ['château', 'trésor'] },
      { who: 'Jacques', text: 'Le monde entier est un théâtre, et tous, hommes et femmes, n\'en sont que les acteurs.', emo: 'ironie', w: 'théâtre', alt: ['jardin', 'miroir'] },
      { who: 'Roméo', text: 'Elle parle ! Oh ! parle encore, ange resplendissant !', emo: 'amour', w: 'ange', alt: ['étoile', 'reine'] },
      { who: 'Hamlet', text: 'Il y a plus de choses sur la terre et dans le ciel que n\'en rêve votre philosophie.', emo: 'surprise', w: 'philosophie', alt: ['poésie', 'fantaisie'] },
    ],
  },
  {
    id: 'fables', title: 'Fables en scène', author: 'Jean de La Fontaine', year: '1668-1694',
    intro: 'Les fables, ce sont de petites pièces ! Un renard, une cigale… à toi de les faire vivre.',
    lines: [
      { who: 'Le Renard', text: 'Hé ! bonjour, Monsieur du Corbeau. Que vous êtes joli ! que vous me semblez beau !', emo: 'ironie', w: 'joli', alt: ['poli', 'gentil'] },
      { who: 'Le Renard', text: 'Apprenez que tout flatteur vit aux dépens de celui qui l\'écoute.', emo: 'ironie', w: 'flatteur', alt: ['chanteur', 'voleur'] },
      { who: 'La Fourmi', text: 'Vous chantiez ? j\'en suis fort aise. Eh bien ! dansez maintenant.', emo: 'ironie', w: 'dansez', alt: ['chantez', 'dormez'] },
      { who: 'Le Loup', text: 'Si ce n\'est toi, c\'est donc ton frère.', emo: 'colere', w: 'frère', alt: ['père', 'cousin'] },
      { who: 'Le narrateur', text: 'Rien ne sert de courir ; il faut partir à point.', emo: 'fierte', w: 'courir', alt: ['chanter', 'dormir'] },
      { who: 'La Cigale', text: 'Je vous paierai, lui dit-elle, avant l\'août, foi d\'animal, intérêt et principal.', emo: 'peur', w: 'animal', alt: ['cigale', 'voisine'] },
    ],
  },
];
