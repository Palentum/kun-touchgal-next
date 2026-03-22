'use client'

import { Chip } from '@heroui/react'

interface PreviewField {
  label: string
  value: string | string[]
}

interface Props {
  fields: PreviewField[]
}

export const FetchPreview = ({ fields }: Props) => {
  const visibleFields = fields.filter((f) =>
    Array.isArray(f.value) ? f.value.length > 0 : !!f.value
  )

  if (!visibleFields.length) return null

  return (
    <div className="rounded-lg border border-default-200 bg-default-50 dark:bg-default-100/50 p-3 space-y-2">
      {visibleFields.map((field) => (
        <div key={field.label} className="flex flex-wrap items-start gap-1.5">
          <span className="text-xs text-default-500 shrink-0 leading-6">
            {field.label}:
          </span>
          {Array.isArray(field.value) ? (
            <div className="flex flex-wrap gap-1">
              {field.value.map((v, i) => (
                <Chip key={i} size="sm" variant="flat">
                  {v}
                </Chip>
              ))}
            </div>
          ) : (
            <span className="text-sm text-default-700 dark:text-default-300 leading-6">
              {field.value}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
