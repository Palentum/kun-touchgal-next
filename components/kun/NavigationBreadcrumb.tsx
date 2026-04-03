'use client'

import { useEffect, useState } from 'react'
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@heroui/react'
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs'
import { ChevronRight } from 'lucide-react'
import { useParams, usePathname } from 'next/navigation'
import { createBreadcrumbItem } from '~/constants/routes/routes'
import type { KunBreadcrumbItem } from '~/constants/routes/constants'

export const KunNavigationBreadcrumb = () => {
  const initialItem: KunBreadcrumbItem[] = [
    {
      key: '/',
      label: '主页',
      href: '/'
    }
  ]

  const [items, setItems] = useState<KunBreadcrumbItem[]>(initialItem)
  const pathname = usePathname()
  const params = useParams()

  const updateBreadcrumb = () => {
    const newItem = createBreadcrumbItem(pathname, params)
    setItems([...initialItem, ...newItem])
  }

  useEffect(() => {
    updateBreadcrumb()

    // Next.js 在软导航时可能会替换整个 <title> 节点，
    // 直接监听旧节点会漏掉后续标题更新
    const observer = new MutationObserver(() => {
      updateBreadcrumb()
    })
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true
    })

    const frameId = requestAnimationFrame(() => {
      updateBreadcrumb()
    })

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [pathname, params])

  const hideBreadcrumbRoutes = [
    '/',
    '/edit/create',
    '/edit/rewrite',
    '/redirect',
    '/friend-link'
  ]

  return (
    <>
      {!hideBreadcrumbRoutes.includes(pathname) && (
        <div className="w-full my-4 bg-background/60 backdrop-blur-lg">
          <div className="px-3 mx-auto sm:px-6 max-w-7xl">
            <Breadcrumbs
              underline="hover"
              separator={<ChevronRight className="size-4" />}
              itemClasses={{
                item: 'text-foreground/60 data-[current=true]:text-foreground'
              }}
              variant="light"
              radius="lg"
              renderEllipsis={({ items, ellipsisIcon, separator }) => (
                <div key="id" className="flex items-center">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        className="size-6 min-w-6"
                        size="sm"
                        variant="flat"
                      >
                        {ellipsisIcon}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Routes">
                      {items.map((item, index) => (
                        <DropdownItem
                          key={index}
                          textValue={index.toString()}
                          href={item.href}
                        >
                          <p className="break-all">{item.children}</p>
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                  {separator}
                </div>
              )}
            >
              {items.map((item, index) => (
                <BreadcrumbItem
                  key={item.key}
                  isCurrent={index === items.length - 1}
                  href={item.href}
                  classNames={{
                    item: 'break-all whitespace-normal'
                  }}
                >
                  {item.label}
                </BreadcrumbItem>
              ))}
            </Breadcrumbs>
          </div>
        </div>
      )}
    </>
  )
}
