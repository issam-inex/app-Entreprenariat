export const missionCategories = {
  development: 'Développement',
  design: 'Design',
  data: 'Data',
  content: 'Contenu',
  other: 'Autre',
}

export function filterMissionsByCategory(missions, category) {
  if (!category) return missions
  return missions.filter(mission => (mission.category || 'uncategorized') === category)
}
