import { fields } from './missionFields.js'

const sections = new Map()
const aliases = {
  title: ['titre', 'intitulé', 'titre de la mission', 'intitulé de la mission', 'nom du projet', 'projet', 'mission', 'title', 'cahier des charges'],
  description: ['description', 'description de la mission', 'présentation', 'contexte', 'besoin', 'besoins', 'périmètre', 'description du projet'],
  objectives: ['objectif', 'objectifs', 'objectifs du projet'],
  instructions: ['consignes', 'instructions', 'contraintes', 'consignes et contraintes'],
  deliverables: ['livrable', 'livrables', 'livrables attendus'],
  evaluation_criteria: ['critères', 'critères d’évaluation', "critères d'évaluation", 'criteres d evaluation', 'critères de réussite'],
  duration: ['durée', 'durée estimée', 'durée de la mission', 'délai', 'délais', 'calendrier', 'duration'],
  skills: ['compétences', 'compétences demandées', 'compétences requises', 'compétences techniques', 'profil recherché', 'prérequis', 'technologies', 'stack technique', 'skills'],
}

function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

for (const [field, names] of Object.entries(aliases)) {
  for (const name of names) sections.set(normalize(name), field)
}

const otherSections = new Set([
  'budget', 'tarifs', 'contact', 'coordonnees', 'annexes', 'confidentialite', 'conditions',
  'modalites', 'informations generales', 'date de publication', 'validation',
])

function cleanLine(value) {
  return value.trim().replace(/^#{1,6}\s+/, '').replace(/^\d+(?:\.\d+)*[.)]\s+/, '').replaceAll('**', '').trim()
}

const technologies = [
  'React', 'React Native', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'JavaScript', 'TypeScript',
  'HTML', 'CSS', 'Tailwind CSS', 'PHP', 'Laravel', 'Symfony', 'Node.js', 'Express', 'Python',
  'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'C#', 'C++', '.NET', 'SQL', 'MySQL',
  'PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'Excel', 'Power BI', 'Figma', 'Docker', 'Git',
  'GitHub', 'REST', 'GraphQL', 'CSV', 'JSON',
]
const technologyPattern = new RegExp(
  `(?<![\\p{L}\\p{N}])(${[...technologies].sort((a, b) => b.length - a.length)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`,
  'giu',
)
const technologyNames = new Map(technologies.map(name => [name.toLowerCase(), name]))
const number = '(?:\\d+(?:[,.]\\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze|vingt)'
const durationPattern = new RegExp(
  `\\b(?:en|pendant|sur|d[ée]lai de|dur[ée]e de)\\s+(${number}(?:\\s+(?:à|a)\\s+${number})?\\s+(?:heures?|jours?(?:\\s+ouvr[ée]s)?|semaines?|mois))\\b`,
  'giu',
)
const sectionCues = {
  objectives: /^(?:l['’]objectif|le but|la mission (?:vise|consiste)|le projet vise)\b/,
  instructions: /^(?:il faut|il faudra|il est interdit|ne pas|l['’]etudiant (?:doit|devra)|le prototype (?:doit|devra))\b/,
  deliverables: /^(?:livrer|fournir|remettre|le livrable|les livrables|(?:l['’]entreprise|on|nous) (?:attend|attendons))\b/,
  evaluation_criteria: /(?:sera (?:evalue|valide)|seront (?:evalues|valides)|l['’]evaluation|la reussite)/,
}

function fillFromProse(candidate, text) {
  const sentences = text.split(/(?<=[.!?])\s+|\r?\n+/).map(cleanLine).filter(Boolean)
  const title = sentences.map(sentence => sentence.match(
    /(?:\b(?:souhaite(?:nt|ons)?|a besoin)\s+|\b(?:le projet|la mission) consiste à\s+)(.+)/iu,
  )?.[1]).find(Boolean)
  if (!candidate.title && title) {
    const subject = title.split(/\s+(?:en|pendant|sur)\s+(?=(?:\d|un\b|une\b|deux\b|trois\b))/iu)[0]
      .replace(/[.!?]+$/, '').trim()
    if (subject.length > 3 && subject.length <= 120) {
      candidate.title = subject.charAt(0).toLocaleUpperCase('fr') + subject.slice(1)
    }
  }
  if (!candidate.duration) {
    const matches = Array.from(text.matchAll(durationPattern), match => match[1])
    const durations = new Set(matches.map(value => normalize(value).replace(/\s+/g, ' ')))
    if (durations.size === 1) candidate.duration = matches[0]
  }
  if (!candidate.skills) {
    const found = Array.from(text.matchAll(technologyPattern), match => technologyNames.get(match[1].toLowerCase()))
    candidate.skills = [...new Set(found)].join(', ')
  }
  for (const [key, pattern] of Object.entries(sectionCues)) {
    if (!candidate[key]) candidate[key] = sentences.filter(sentence => pattern.test(normalize(sentence))).join('\n')
  }
}

export function parseBrief(text, { analyzeProse = false } = {}) {
  const collected = Object.fromEntries(fields.map(([key]) => [key, []]))
  const unassigned = []
  let active = null

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = cleanLine(raw)
    if (!line) continue
    const separator = line.indexOf(':')
    const heading = separator >= 0 ? line.slice(0, separator) : line
    const field = sections.get(normalize(heading))
    const value = separator >= 0 ? line.slice(separator + 1).trim() : ''
    if (field) {
      active = field
      if (value) collected[field].push(value)
    } else if (/^\s*#{1,6}\s/.test(raw) || otherSections.has(normalize(heading))) {
      active = null
    } else if (active) {
      collected[active].push(line)
      if (active === 'title') active = null
    } else {
      unassigned.push(line)
    }
    if (active === 'title' && collected.title.length) active = null
  }

  if (!collected.description.length) collected.description.push(...unassigned)
  const candidate = {
    ...Object.fromEntries(Object.entries(collected).map(([key, lines]) => [key, lines.join('\n')])),
    title: collected.title[0] ?? '',
    description: collected.description.join('\n'),
    duration: collected.duration.join(' '),
    skills: collected.skills.map(line => line.replace(/^[-•*]\s+/, '')).join(', '),
  }
  if (analyzeProse) fillFromProse(candidate, text)
  const values = {}
  const truncated = []
  for (const [key, , limit] of fields) {
    const value = candidate[key].trim()
    if (!value) continue
    if (value.length > limit) truncated.push(key)
    values[key] = value.slice(0, limit).trim()
  }
  return { values, truncated }
}
