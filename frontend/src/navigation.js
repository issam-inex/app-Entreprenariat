export const pages = {
  studentProfile: ['Mon profil', 'Mettez à jour votre photo, vos compétences et vos liens professionnels.', '◉'],
  companyProfile: ['Profil entreprise', 'Présentez votre entreprise aux étudiants.', '◉'],
  myApplications: ['Mes candidatures', 'Consultez, modifiez ou retirez vos candidatures.', '▣'],
  missionWork: ['Mes missions en cours', 'Suivez les missions attribuées et la remise des livrables.', '▤'],
  companies: ['Entreprises', 'Recherchez une entreprise vérifiée et consultez ses missions.', '▤'],
  verification: ['Vérification de l’entreprise', 'Soumettez votre dossier et suivez les décisions de StageLik.', '✓'],
  admin: ['Entreprises', 'Consultez les entreprises inscrites et ouvrez leurs dossiers de vérification.', '▣'],
  publish: ['Préparer une mission', 'Préparez un brouillon avant de publier votre mission.', '＋'],
  companyMissions: ['Mes missions', 'Retrouvez vos brouillons et gérez la visibilité de vos missions.', '▤'],
  missions: ['Missions disponibles', 'Trouvez une mission et mettez vos compétences en pratique.', '▤'],
  applications: ['Candidatures reçues', 'Retrouvez les candidatures pour chacune de vos missions.', '▣'],
}

export const pageHashes = {
  studentProfile: '#mon-profil',
  companyProfile: '#profil-entreprise',
  myApplications: '#mes-candidatures',
  missionWork: '#missions-en-cours',
  companies: '#entreprises',
  login: '#connexion',
  register: '#inscription',
  password: '#reinitialiser',
  verification: '#verification',
  admin: '#administration',
  home: '#accueil',
  publish: '#publier',
  companyMissions: '#mes-missions',
  missions: '#missions',
  applications: '#candidatures',
}
export function pageFromHash(pathname) {
  return Object.keys(pageHashes).find(key => pageHashes[key] === '#' + pathname.slice(1)) ?? 'home'
}
