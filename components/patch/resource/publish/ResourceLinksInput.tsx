'use client'

import { useEffect } from 'react'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Plus, X } from 'lucide-react'
import { ErrorType } from '../share'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import { fetchLinkData, fetchListData } from './fetchAlistSize'
import toast from 'react-hot-toast'

interface ResourceLinksInputProps {
  errors: ErrorType
  storage: string
  content: string
  size: string
  setContent: (value: string) => void
  setSize: (value: string) => void
  setCode?: (value: string) => void
}

const CODE_PATTERNS = [
  /提取码\s*[：:]\s*([a-zA-Z0-9]+)/,
  /访问码\s*[：:]\s*([a-zA-Z0-9]+)/,
  /密码\s*[：:]\s*([a-zA-Z0-9]+)/,
  /pwd\s*[：:=]\s*([a-zA-Z0-9]+)/i
]

const parseResourceLink = (input: string): { url: string; code: string } => {
  const urlMatch = input.match(/https?:\/\/[^\s]+/)
  if (!urlMatch) {
    return { url: input.trim(), code: '' }
  }

  let url = urlMatch[0].replace(/[,.!?，。！？、「」【】]+$/, '')
  let code = ''

  try {
    const urlObj = new URL(url)
    const pwdParam =
      urlObj.searchParams.get('pwd') ||
      urlObj.searchParams.get('password') ||
      urlObj.searchParams.get('code')
    if (pwdParam) {
      code = pwdParam
      urlObj.searchParams.delete('pwd')
      urlObj.searchParams.delete('password')
      urlObj.searchParams.delete('code')
      url = urlObj.toString().replace(/\?$/, '')
    }
  } catch {
    // URL 解析失败，保持原样
  }

  if (!code) {
    for (const pattern of CODE_PATTERNS) {
      const match = input.match(pattern)
      if (match) {
        code = match[1]
        break
      }
    }
  }

  return { url, code }
}

export const ResourceLinksInput = ({
  errors,
  storage,
  content,
  size,
  setContent,
  setSize,
  setCode
}: ResourceLinksInputProps) => {
  const links = content.trim() ? content.trim().split(',') : ['']

  const checkLinkSize = async (link: string) => {
    toast('正在尝试从 TouchGal Alist 获取文件大小')
    const data = await fetchLinkData(link)
    if (data && data.code === 0) {
      let sizeInGB
      if (data.data.source.size > 0) {
        sizeInGB = (data.data.source.size / 1024 ** 3).toFixed(3)
      } else {
        const listSize = await fetchListData(data.data.key)
        sizeInGB = listSize ? (listSize / 1024 ** 3).toFixed(3) : ''
      }
      toast.success('获取文件大小成功')
      setSize(`${sizeInGB} GB`)
    }
  }

  useEffect(() => {
    if (!links.length || size) {
      return
    }
    if (links.some((link) => link.includes('pan.touchgal.net/s/'))) {
      checkLinkSize(links[0])
    }
  }, [links, setSize])

  const handleLinkChange = (index: number, rawValue: string) => {
    const newLinks = [...links]
    newLinks[index] = rawValue
    setContent(newLinks.filter(Boolean).toString())
  }

  const handleLinkPaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    if (storage === 's3' || !setCode) return
    const pasted = e.clipboardData.getData('text')
    if (!pasted.trim()) return
    const { url, code } = parseResourceLink(pasted)
    if (url !== pasted.trim() || code) {
      e.preventDefault()
      const newLinks = [...links]
      newLinks[index] = url
      setContent(newLinks.filter(Boolean).toString())
      if (code) {
        setCode(code)
        toast.success('已自动识别并填入提取码')
      }
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">资源链接</h3>
      <p className="text-sm text-default-500">
        {storage === 's3'
          ? '已为您自动创建资源链接 √'
          : '上传资源会自动添加资源链接, 您也可以自行添加资源链接。为保证单一性, 建议您一次添加一条资源链接'}
      </p>

      {links.map((link, index) => (
        <div key={index} className="flex items-center gap-2">
          <Chip color="primary" variant="flat">
            {
              SUPPORTED_RESOURCE_LINK_MAP[
                storage as keyof typeof SUPPORTED_RESOURCE_LINK_MAP
              ]
            }
          </Chip>

          <div className="flex-col w-full">
            <Input
              isRequired
              placeholder={
                storage === 's3' ? '资源链接不可编辑' : '请输入资源链接'
              }
              value={link}
              isReadOnly={storage === 's3'}
              isDisabled={storage === 's3'}
              isInvalid={!!errors.content}
              errorMessage={errors.content?.message}
              onChange={(e) => handleLinkChange(index, e.target.value)}
              onPaste={(e) => handleLinkPaste(index, e)}
            />
          </div>

          {storage !== 's3' && (
            <div className="flex justify-end">
              {index === links.length - 1 ? (
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={() => setContent([...links, ''].toString())}
                >
                  <Plus className="size-4" />
                </Button>
              ) : (
                <Button
                  isIconOnly
                  variant="flat"
                  color="danger"
                  onPress={() => {
                    const newLinks = links.filter((_, i) => i !== index)
                    setContent(newLinks.toString())
                  }}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
