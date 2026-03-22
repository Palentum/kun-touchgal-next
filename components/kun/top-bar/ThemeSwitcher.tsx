'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import { Tooltip } from '@heroui/tooltip'
import { Button } from '@heroui/button'
import { Moon, Sun, SunMoon } from 'lucide-react'

enum Theme {
  dark = 'dark',
  light = 'light',
  system = 'system'
}

enum ThemeLabel {
  dark = '深色主题',
  light = '浅色主题',
  system = '跟随系统'
}

const themeOrder: Theme[] = [Theme.light, Theme.dark, Theme.system]

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const currentTheme =
    theme === Theme.light || theme === Theme.dark || theme === Theme.system
      ? theme
      : Theme.system

  const themeIcon = useMemo(() => {
    if (currentTheme === Theme.light) {
      return <Sun />
    }
    if (currentTheme === Theme.dark) {
      return <Moon />
    }
    return <SunMoon />
  }, [currentTheme])

  const nextTheme =
    themeOrder[(themeOrder.indexOf(currentTheme) + 1) % themeOrder.length]
  const tooltipContent = ThemeLabel[currentTheme]

  return (
    <Tooltip disableAnimation showArrow closeDelay={0} content={tooltipContent}>
      <div className="flex">
        <Button
          isIconOnly
          variant="light"
          aria-label={tooltipContent}
          className="text-default-500"
          onPress={() => setTheme(nextTheme)}
        >
          {themeIcon}
        </Button>
      </div>
    </Tooltip>
  )
}
