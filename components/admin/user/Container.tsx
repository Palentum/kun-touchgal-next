'use client'

import {
  Chip,
  Input,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@heroui/react'
import { Search } from 'lucide-react'
import { useEffect, useState, type Key } from 'react'
import { RenderCell } from './RenderCell'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunLoading } from '~/components/kun/Loading'
import { useMounted } from '~/hooks/useMounted'
import { useDebounce } from 'use-debounce'
import { KunPagination } from '~/components/kun/Pagination'
import type { AdminUser } from '~/types/api/admin'

type AdminUserSearchType = 'name' | 'email' | 'id'

const columns = [
  { name: '用户', uid: 'user' },
  { name: '角色', uid: 'role' },
  { name: '状态', uid: 'status' },
  { name: '操作', uid: 'actions' }
]

const searchTypeOptions: Array<{
  key: AdminUserSearchType
  label: string
  placeholder: string
}> = [
  { key: 'name', label: '用户名', placeholder: '搜索用户名...' },
  { key: 'email', label: '邮箱', placeholder: '搜索邮箱...' },
  { key: 'id', label: '用户 ID', placeholder: '搜索用户 ID...' }
]

interface Props {
  initialUsers: AdminUser[]
  initialTotal: number
}

export const User = ({ initialUsers, initialTotal }: Props) => {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<AdminUserSearchType>('name')
  const [debouncedQuery] = useDebounce(searchQuery, 500)
  const isMounted = useMounted()

  const [loading, setLoading] = useState(false)
  const fetchData = async () => {
    setLoading(true)

    const { users, total } = await kunFetchGet<{
      users: AdminUser[]
      total: number
    }>('/admin/user', {
      page,
      limit: 30,
      search: debouncedQuery,
      searchType
    })

    setLoading(false)
    setUsers(users)
    setTotal(total)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchData()
  }, [page, debouncedQuery, searchType])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleSearchTypeChange = (keys: 'all' | Set<Key>) => {
    const key = Array.from(keys)[0] as AdminUserSearchType | undefined
    if (!key) {
      return
    }

    setSearchType(key)
    setPage(1)
  }

  const currentPlaceholder =
    searchTypeOptions.find((option) => option.key === searchType)?.placeholder ??
    '搜索用户名...'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Chip color="primary" variant="flat">
          杂鱼! 不许视奸!
        </Chip>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          aria-label="搜索类型"
          className="w-full sm:max-w-40"
          selectedKeys={new Set([searchType])}
          onSelectionChange={handleSearchTypeChange}
        >
          {searchTypeOptions.map((option) => (
            <SelectItem key={option.key}>{option.label}</SelectItem>
          ))}
        </Select>

        <Input
          fullWidth
          isClearable
          placeholder={currentPlaceholder}
          startContent={<Search className="text-default-300" size={20} />}
          value={searchQuery}
          onValueChange={handleSearch}
        />
      </div>

      {loading ? (
        <KunLoading hint="正在获取消息数据..." />
      ) : (
        <Table
          aria-label="用户管理"
          bottomContent={
            <div className="flex justify-center w-full">
              <KunPagination
                page={page}
                total={Math.ceil(total / 30)}
                onPageChange={setPage}
                isLoading={loading}
              />
            </div>
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={users}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>
                    {RenderCell(item, columnKey.toString())}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
