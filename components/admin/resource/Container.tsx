'use client'

import {
  Autocomplete,
  AutocompleteItem,
  Avatar,
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
import { kunFetchGet } from '~/utils/kunFetch'
import { useEffect, useState, type Key } from 'react'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { RenderCell } from './RenderCell'
import { useDebounce } from 'use-debounce'
import { KunPagination } from '~/components/kun/Pagination'
import type { AdminResource, AdminUser } from '~/types/api/admin'

type ResourceSearchType = 'content' | 'user'

const columns = [
  { name: '资源', id: 'name' },
  { name: '用户', id: 'user' },
  { name: '存储', id: 'storage' },
  { name: '大小', id: 'size' },
  { name: '创建时间', id: 'created' },
  { name: '操作', id: 'actions' }
]

const searchTypeOptions: Array<{
  key: ResourceSearchType
  label: string
  placeholder: string
}> = [
  {
    key: 'content',
    label: '资源链接',
    placeholder: '输入资源链接（或 BLAKE3 Hash）搜索'
  },
  { key: 'user', label: '用户名', placeholder: '输入用户名搜索...' }
]

interface UserOption {
  id: number
  name: string
  avatar: string
}

interface Props {
  initialResources: AdminResource[]
  initialTotal: number
}

export const Resource = ({ initialResources, initialTotal }: Props) => {
  const [resources, setResources] = useState<AdminResource[]>(initialResources)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [searchType, setSearchType] = useState<ResourceSearchType>('content')

  const [contentQuery, setContentQuery] = useState('')
  const [debouncedContent] = useDebounce(contentQuery, 500)

  const [userInput, setUserInput] = useState('')
  const [debouncedUserInput] = useDebounce(userInput, 400)
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userSearchLoading, setUserSearchLoading] = useState(false)

  const isMounted = useMounted()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!debouncedUserInput.trim()) {
      setUserOptions([])
      return
    }
    let cancelled = false
    const fetchUsers = async () => {
      setUserSearchLoading(true)
      try {
        const { users } = await kunFetchGet<{
          users: AdminUser[]
          total: number
        }>('/admin/user', {
          page: 1,
          limit: 10,
          search: debouncedUserInput,
          searchType: 'name'
        })
        if (!cancelled) {
          setUserOptions(
            users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }))
          )
        }
      } finally {
        if (!cancelled) {
          setUserSearchLoading(false)
        }
      }
    }
    fetchUsers()
    return () => {
      cancelled = true
    }
  }, [debouncedUserInput])

  useEffect(() => {
    if (!isMounted) {
      return
    }
    const fetchData = async () => {
      setLoading(true)
      try {
        const params: Record<string, unknown> = { page, limit: 30 }
        if (searchType === 'content' && debouncedContent) {
          params.search = debouncedContent
        }
        if (searchType === 'user' && selectedUserId) {
          params.userId = selectedUserId
        }

        const { resources, total } = await kunFetchGet<{
          resources: AdminResource[]
          total: number
        }>('/admin/resource', params)

        setResources(resources)
        setTotal(total)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isMounted, page, searchType, debouncedContent, selectedUserId])

  const handleSearchTypeChange = (keys: 'all' | Set<Key>) => {
    const key = Array.from(keys)[0] as ResourceSearchType | undefined
    if (!key) {
      return
    }
    setSearchType(key)
    setPage(1)
    setContentQuery('')
    setUserInput('')
    setSelectedUserId(null)
    setUserOptions([])
  }

  const handleContentSearch = (value: string) => {
    setContentQuery(value)
    setPage(1)
  }

  const handleUserSelectionChange = (key: Key | null) => {
    if (!key) {
      setSelectedUserId(null)
    } else {
      setSelectedUserId(Number(key))
    }
    setPage(1)
  }

  const handleUserInputChange = (value: string) => {
    setUserInput(value)
    if (!value) {
      setSelectedUserId(null)
      setPage(1)
    }
  }

  const currentPlaceholder =
    searchTypeOptions.find((o) => o.key === searchType)?.placeholder ?? ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">补丁资源管理</h1>
        <Chip color="primary" variant="flat">
          支持按内容、哈希和用户搜索
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

        {searchType === 'user' ? (
          <Autocomplete
            fullWidth
            isClearable
            placeholder={currentPlaceholder}
            startContent={<Search className="text-default-300" size={20} />}
            inputValue={userInput}
            isLoading={userSearchLoading}
            items={userOptions}
            onInputChange={handleUserInputChange}
            onSelectionChange={handleUserSelectionChange}
          >
            {(user) => (
              <AutocompleteItem key={user.id} textValue={user.name}>
                <div className="flex items-center gap-2">
                  <Avatar
                    src={user.avatar}
                    size="sm"
                    showFallback
                    name={user.name.charAt(0).toUpperCase()}
                  />
                  <span>{user.name}</span>
                </div>
              </AutocompleteItem>
            )}
          </Autocomplete>
        ) : (
          <Input
            fullWidth
            isClearable
            placeholder={currentPlaceholder}
            startContent={<Search className="text-default-300" size={20} />}
            value={contentQuery}
            onValueChange={handleContentSearch}
          />
        )}
      </div>

      {loading ? (
        <KunLoading hint="正在加载资源列表..." />
      ) : (
        <Table
          aria-label="资源管理列表"
          bottomContent={
            <div className="flex justify-center w-full">
              <KunPagination
                total={Math.ceil(total / 30)}
                onPageChange={setPage}
                isLoading={loading}
                page={page}
              />
            </div>
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.id}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={resources}>
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
