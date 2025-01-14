import { Tags, MessageSquare, Archive } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

interface HomeNavItem {
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >
  label: string
  href: string
  color: 'primary' | 'secondary' | 'success'
  isExternal: boolean
}

export const homeNavigationItems: HomeNavItem[] = [
  {
    icon: Tags,
    label: '标签',
    href: '/docs',
    color: 'primary',
    isExternal: false
  },
  {
    icon: MessageSquare,
    label: '论坛',
    href: '/games',
    color: 'secondary',
    isExternal: true
  },
  {
    icon: Archive,
    label: '归档',
    href: '/community',
    color: 'success',
    isExternal: true
  }
]
