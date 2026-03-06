import { Input } from '@heroui/input'

interface Props {
  date: string
  setDate: (date: string) => void
  errors?: string
}

export const ReleaseDateInput = ({ date, setDate, errors }: Props) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const normalizedRaw = raw.replace(/[０-９]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0xfee0)
    )
    const fullChineseDateMatch = normalizedRaw.match(
      /^(\d{1,4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?\s*$/
    )
    if (fullChineseDateMatch) {
      const [, year, monthText, dayText] = fullChineseDateMatch
      const month = Math.min(Math.max(Number(monthText), 1), 12)
      const day = Math.min(Math.max(Number(dayText), 1), 31)
      const formatted = `${year.slice(0, 4)}-${String(month).padStart(
        2,
        '0'
      )}-${String(day).padStart(2, '0')}`
      setDate(formatted)
      return
    }

    let value = normalizedRaw
      .replace(/[年月./]/g, '-')
      .replace(/[日号]/g, '')
      .replace(/[^\d-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-/, '')

    if (value.includes('-')) {
      const parts = value.split('-').slice(0, 3)
      const hasMonthSegment = parts.length > 1
      const hasDaySegment = parts.length > 2

      if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].slice(0, 4)
      }

      if (parts[1]) {
        parts[1] = parts[1].replace(/\D/g, '').slice(0, 2)
        if (parts[1].length === 2 && Number(parts[1]) > 12) {
          parts[1] = '12'
        }
      }

      if (parts[2]) {
        parts[2] = parts[2].replace(/\D/g, '').slice(0, 2)
        if (parts[2].length === 2 && Number(parts[2]) > 31) {
          parts[2] = '31'
        }
      }

      value = parts[0] || ''
      if (hasMonthSegment) {
        value += `-${parts[1] || ''}`
      }
      if (hasDaySegment) {
        value += `-${parts[2] || ''}`
      }
    } else {
      value = value.replace(/\D/g, '')

      if (value.length > 8) {
        value = value.slice(0, 8)
      }

      if (value.length >= 4) {
        const year = value.slice(0, 4)
        const month = value.slice(4, 6)
        const day = value.slice(6, 8)

        value = year
        if (month) {
          value += `-${month}`
        }
        if (day) {
          value += `-${day}`
        }
      }
    }

    setDate(value)
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl">游戏发售日期 (可选)</h2>
      <Input
        label="发售日期"
        placeholder="请输入游戏的发售日期"
        value={date}
        onChange={handleDateChange}
        className="max-w-xs"
        description="格式: YYYY-MM-DD (例如 2019-10-07)"
      />
    </div>
  )
}
