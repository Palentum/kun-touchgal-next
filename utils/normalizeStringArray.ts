export const normalizeStringArray = (values: readonly unknown[]): string[] => {
  const normalizedValues = values.flatMap((value) => {
    if (typeof value !== 'string') {
      return []
    }

    const normalizedValue = value.trim()
    return normalizedValue ? [normalizedValue] : []
  })

  return [...new Set(normalizedValues)]
}

export const parseCommaSeparatedStringArray = (value: string): string[] => {
  return normalizeStringArray(value.split(/[,，]/))
}
