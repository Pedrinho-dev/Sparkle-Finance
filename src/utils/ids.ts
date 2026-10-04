export function createId(): string {
  return crypto.randomUUID()
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
