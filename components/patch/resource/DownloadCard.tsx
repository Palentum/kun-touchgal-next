'use client'

import { Snippet } from '@heroui/snippet'
import { Chip } from '@heroui/chip'
import { Cloud, Database, Link as LinkIcon } from 'lucide-react'
import { Microsoft } from '~/components/kun/icons/Microsoft'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import { kunFetchPut } from '~/utils/kunFetch'
import { KunExternalLink } from '~/components/kun/external-link/ExternalLink'
import type { JSX } from 'react'
import type { PatchResource, PatchResourceLink } from '~/types/api/patch'

const storageIcons: { [key: string]: JSX.Element } = {
  touchgal: <Database className="size-4" />,
  s3: <Cloud className="size-4" />,
  onedrive: <Microsoft className="size-4" />,
  user: <LinkIcon className="size-4" />
}

interface Props {
  resource: PatchResource
  link: PatchResourceLink
}

export const ResourceDownloadCard = ({ resource, link }: Props) => {
  const handleClickDownload = async () => {
    await kunFetchPut<KunResponse<{}>>('/patch/resource/download', {
      patchId: resource.patchId,
      resourceId: resource.id,
      linkId: link.id
    })
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-2">
        <Chip
          color="secondary"
          variant="flat"
          startContent={storageIcons[link.storage]}
        >
          {SUPPORTED_RESOURCE_LINK_MAP[link.storage] ?? link.storage}
        </Chip>
        <Chip variant="flat" startContent={<Database className="w-4 h-4" />}>
          {link.size}
        </Chip>
      </div>

      <p className="text-sm text-default-500">点击下面的链接以下载</p>

      <div className="space-y-2">
        <KunExternalLink
          className="break-all"
          onPress={handleClickDownload}
          underline="always"
          link={link.content}
        >
          {link.content}
        </KunExternalLink>

        <div className="flex flex-wrap gap-2">
          {link.code && (
            <Snippet
              tooltipProps={{
                content: '点击复制提取码'
              }}
              size="sm"
              symbol="提取码"
              color="primary"
              className="py-0"
            >
              {link.code}
            </Snippet>
          )}

          {link.password && (
            <Snippet
              tooltipProps={{
                content: '点击复制解压码'
              }}
              size="sm"
              symbol="解压码"
              color="primary"
              className="py-0"
            >
              {link.password}
            </Snippet>
          )}
        </div>

        {link.storage === 's3' && link.hash && (
          <>
            <p className="text-sm">
              BLACK3 校验码 (您可以根据此校验码校验下载文件完整性)
            </p>
            <Snippet symbol="" className="flex overflow-auto whitespace-normal">
              {link.hash}
            </Snippet>
          </>
        )}
      </div>
    </div>
  )
}
