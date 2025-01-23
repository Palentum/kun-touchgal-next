import { Input } from '@nextui-org/input'

interface Props {
  date: string
  setDate: (date: string) => void
  errors?: string
}

export const ReleaseDateInput = ({ date, setDate, errors }: Props) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')

    if (value.length > 8) {
      value = value.slice(0, 8)
    }

    if (value.length >= 4) {
      const year = value.slice(0, 4)
      const month = value.slice(4, 6)
      const day = value.slice(6, 8)

      let formattedDate = year
      if (month) {
        const monthNum = parseInt(month)
        if (monthNum > 0 && monthNum <= 12) {
          formattedDate += `-${parseInt(month)}`
        }
      }
      if (day) {
        const dayNum = parseInt(day)
        if (dayNum > 0 && dayNum <= 31) {
          formattedDate += `-${parseInt(day)}`
        }
      }

      setDate(formattedDate)
    } else {
      setDate(value)
    }
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
