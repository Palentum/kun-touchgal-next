import { SUPPORTED_TYPE_MAP } from '~/constants/resource'
import type { KunSiteConfig } from './config'

const STATIC_SITE_NAME = 'TouchGal'
const STATIC_SITE_MENTION = '@touchgal'
const STATIC_SITE_TITLE = 'TouchGal - 一站式Galgame文化社区!'
const STATIC_SITE_IMAGE =
  'https://img.touchgalstatic.org/uploads/20241217174250074.avif'
const STATIC_SITE_DESCRIPTION =
  'TouchGal 是一个一站式 Galgame 文化社区。提供Galgame 论坛、Galgame 下载等服务。承诺永久免费, 高质量。为Galgame 爱好者提供一片净土！'
const STATIC_SITE_URL = 'https://www.touchgal.io'
const STATIC_SITE_NAV = 'https://gal.red'
const STATIC_SITE_LIST = [
  { name: STATIC_SITE_NAME, url: 'https://www.touchgal.net' },
  { name: STATIC_SITE_NAME, url: 'https://www.touchgal.moe' },
  { name: STATIC_SITE_NAME, url: 'https://www.touchgal.one' },
  { name: STATIC_SITE_NAME, url: 'https://www.touchgal.com' },
  { name: STATIC_SITE_NAME, url: 'https://www.touchgal.org' },
  { name: STATIC_SITE_NAME, url: 'https://www.touchgal.me' },
  { name: STATIC_SITE_NAME, url: 'https://www.touchgal.co' }
]
const STATIC_SITE_KEYWORDS = [
  'TouchGAL',
  'Gal',
  'Galgame',
  '论坛',
  '网站',
  'Galgame 下载',
  'Galgame 资源',
  'Galgame wiki',
  'Galgame 评测',
  'Galgame 数据分析',
  'Galgame 新作动态',
  'Galgame 汉化 / 国际化',
  'Galgame 制作',
  'Galgame 讨论',
  '游戏交流',
  '其他交流'
]

export const kunMoyuMoe: KunSiteConfig = {
  title: STATIC_SITE_TITLE,
  titleShort: 'TouchGal',
  template: '%s - TouchGal',
  description: STATIC_SITE_DESCRIPTION,
  keywords: STATIC_SITE_KEYWORDS,
  canonical: STATIC_SITE_URL,
  author: [
    { name: STATIC_SITE_TITLE, url: STATIC_SITE_URL },
    { name: STATIC_SITE_NAME, url: STATIC_SITE_NAV },
    ...STATIC_SITE_LIST
  ],
  creator: {
    name: STATIC_SITE_NAME,
    mention: STATIC_SITE_MENTION,
    url: STATIC_SITE_URL
  },
  publisher: {
    name: STATIC_SITE_NAME,
    mention: STATIC_SITE_MENTION,
    url: STATIC_SITE_URL
  },
  domain: {
    main: STATIC_SITE_URL,
    imageBed: 'https://img.touchgalstatic.org',
    storage: STATIC_SITE_URL,
    kungal: STATIC_SITE_URL
  },
  og: {
    title: STATIC_SITE_TITLE,
    description: STATIC_SITE_DESCRIPTION,
    image: STATIC_SITE_IMAGE,
    url: STATIC_SITE_URL
  },
  images: [
    {
      url: STATIC_SITE_IMAGE,
      width: 1000,
      height: 800,
      alt: STATIC_SITE_TITLE
    }
  ]
}
