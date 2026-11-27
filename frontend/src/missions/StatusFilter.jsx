import React from 'react'

export default function StatusFilter({ value, onChange, options }) {
  return <label className="field mission-category-filter">
    Filtrer par statut
    <select value={value} onChange={event => onChange(event.target.value)}>
      <option value="">Tous les statuts</option>
      {Object.entries(options).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  </label>
}
