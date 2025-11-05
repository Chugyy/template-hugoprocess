function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date)
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

export function transformKeysToCamel<T = unknown>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToCamel(item)) as T
  }

  if (isObject(obj)) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      // Special mapping: contact_name -> contact
      const camelKey = key === 'contact_name' ? 'contact' : toCamelCase(key)
      result[camelKey] = transformKeysToCamel(value)
    }
    return result as T
  }

  return obj as T
}

export function transformKeysToSnake<T = unknown>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToSnake(item)) as T
  }

  if (isObject(obj)) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      // Special mapping: contact -> contact_name
      const snakeKey = key === 'contact' ? 'contact_name' : toSnakeCase(key)
      result[snakeKey] = transformKeysToSnake(value)
    }
    return result as T
  }

  return obj as T
}
