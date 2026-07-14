export function getItem<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export function setItem<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeItem(key: string) {
  localStorage.removeItem(key)
}
