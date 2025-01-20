import { Tags, MessageSquare, Archive } from 'lucide-react'
import { kunMoyuMoe } from '~/config/moyu-moe'
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
    href: '/tag',
    color: 'primary',
    isExternal: false
  },
  {
    icon: MessageSquare,
    label: '论坛',
    href: kunMoyuMoe.domain.forum,
    color: 'secondary',
    isExternal: true
  },
  {
    icon: Archive,
    label: '归档',
    href: kunMoyuMoe.domain.archive,
    color: 'success',
    isExternal: true
  }
]
