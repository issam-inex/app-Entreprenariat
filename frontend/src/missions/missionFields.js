export const fields = [
  ['title', 'Titre de la mission', 180, true],
  ['description', 'Description', 4000, true],
  ['duration', 'Durée', 100, true],
  ['skills', 'Compétences demandées', 500, true],
  ['objectives', 'Objectifs', 2000],
  ['instructions', 'Consignes et contraintes', 3000],
  ['deliverables', 'Livrables attendus', 2000],
  ['evaluation_criteria', 'Critères d’évaluation', 2000],
]
export const emptyMission = { category: '', ...Object.fromEntries(fields.map(([key]) => [key, ''])) }
