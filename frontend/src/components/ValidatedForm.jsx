import React, { cloneElement, createContext, useContext, useId, useRef, useState } from 'react'

const FormErrors = createContext({})

function fieldError(field, form) {
  if (field.disabled) return
  const { validity, dataset, value, type } = field
  if (type === 'checkbox' && dataset.confirmation && form.elements.status?.value === 'verified' && !field.checked) {
    return dataset.confirmation
  }
  if (validity.valueMissing || (type !== 'password' && field.required && !value.trim())) {
    if (type === 'file') return 'Ajoutez le fichier demandé.'
    if (field.tagName === 'SELECT') return 'Sélectionnez une option.'
    return 'Ce champ est obligatoire.'
  }
  if (validity.typeMismatch && type === 'email') return 'Saisissez une adresse e-mail valide.'
  if (type === 'url' && value && (validity.typeMismatch || !/^https?:\/\//i.test(value))) {
    return 'Saisissez un lien valide commençant par http:// ou https://.'
  }
  if (validity.patternMismatch) return dataset.patternMessage ?? 'Respectez le format indiqué.'
  if (type === 'password' && value && field.minLength > 0 && value.length < field.minLength) {
    return `Saisissez au moins ${field.minLength} caractères.`
  }
  if (type === 'password' && dataset.maxBytes && new TextEncoder().encode(value).length > Number(dataset.maxBytes)) {
    return `Le mot de passe doit contenir au maximum ${dataset.maxBytes} octets.`
  }
  if (field.maxLength >= 0 && value.length > field.maxLength) return `Utilisez au maximum ${field.maxLength} caractères.`
  if (type === 'file' && field.files[0] && dataset.pdfLimit) {
    const file = field.files[0]
    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) return 'Choisissez un fichier PDF.'
    if (file.size > Number(dataset.pdfLimit) * 1024 * 1024) return `Le fichier ne doit pas dépasser ${dataset.pdfLimit} Mo.`
  }
}

export function ValidatedForm({ onSubmit, children, ...props }) {
  const [errors, setErrors] = useState({})
  const attempted = useRef(false)
  const serverErrors = useRef({})

  function validate(form) {
    return Object.fromEntries(Array.from(form.elements).flatMap(field => {
      if (!field.name || !field.willValidate || field.type === 'submit') return []
      const error = fieldError(field, form)
      return error ? [[field.name, error]] : []
    }))
  }

  return <FormErrors.Provider value={errors}>
    <form {...props} noValidate onChange={event => {
      if (!attempted.current) return
      delete serverErrors.current[event.target.name]
      setErrors({ ...serverErrors.current, ...validate(event.currentTarget) })
    }} onSubmit={event => {
      event.preventDefault()
      const form = event.currentTarget
      attempted.current = true
      serverErrors.current = {}
      const next = validate(form)
      setErrors(next)
      const firstInvalid = Object.keys(next)[0]
      if (firstInvalid) {
        form.elements.namedItem(firstInvalid)?.focus()
        return
      }
      onSubmit(event, fields => {
        const messages = Object.fromEntries(Object.entries(fields ?? {}).flatMap(([name, values]) =>
          form.elements.namedItem(name) && (typeof values === 'string' || values?.[0])
            ? [[name, typeof values === 'string' ? values : values[0]]] : [],
        ))
        if (!Object.keys(messages).length) return false
        serverErrors.current = messages
        setErrors({ ...messages, ...validate(form) })
        form.elements.namedItem(Object.keys(messages)[0])?.focus()
        return true
      })
    }}>{children}</form>
  </FormErrors.Provider>
}

export function FormField({ label, children, className = 'field', error }) {
  const id = useId()
  const errors = useContext(FormErrors)
  const message = error ?? errors[children.props.name]
  const controlId = children.props.id ?? id
  const errorId = `${controlId}-error`
  const checkbox = children.props.type === 'checkbox'
  const control = cloneElement(children, {
    id: controlId,
    'aria-invalid': Boolean(message),
    'aria-describedby': [children.props['aria-describedby'], message && errorId].filter(Boolean).join(' ') || undefined,
  })
  return <div className={className}>
    <label htmlFor={controlId}>{checkbox && <>{control}{' '}</>}{label}</label>
    {!checkbox && control}
    {message && <small id={errorId} className="field-error" role="alert">{message}</small>}
  </div>
}
