import React from 'react'
import { missionCategories } from './missionCategories.js'

export default function MissionCategoryFilter({ value, onChange }) {
  return <label className="field mission-category-filter">
    Filtrer par type
    <select value={value} onChange={event => onChange(event.target.value)}>
      <option value="">Tous les types</option>
      {Object.entries(missionCategories).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      <option value="uncategorized">Sans type</option>
    </select>
  </label>
}
