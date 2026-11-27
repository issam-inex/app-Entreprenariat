export const initials = name => name.split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase()
