'use client'

import { Switch, Input, Button, Card, CardBody, Chip } from '@nextui-org/react'
import { useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'

export const RedirectSetting = () => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [excludedRoutes, setExcludedRoutes] = useState<string[]>([])
  const [excludedDomains, setExcludedDomains] = useState<string[]>([])

  const [newRoute, setNewRoute] = useState('')
  const [newDomain, setNewDomain] = useState('')

  const addExcludedRoute = () => {
    if (newRoute && !excludedRoutes.includes(newRoute)) {
      setExcludedRoutes([...excludedRoutes, newRoute])
      setNewRoute('')
    }
  }

  const addExcludedDomain = () => {
    if (newDomain && !excludedDomains.includes(newDomain)) {
      setExcludedDomains([...excludedDomains, newDomain])
      setNewDomain('')
    }
  }

  const removeRoute = (route: string) => {
    setExcludedRoutes(excludedRoutes.filter((r) => r !== route))
  }

  const removeDomain = (domain: string) => {
    setExcludedDomains(excludedDomains.filter((d) => d !== domain))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">外链重定向</h3>
              <p className="text-small text-default-500">
                将排除列表之外的所有非本站链接重定向至跳转页
              </p>
            </div>
            <Switch
              isSelected={isEnabled}
              onValueChange={setIsEnabled}
              size="lg"
              color="primary"
              startContent={<ExternalLink className="w-4 h-4" />}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-lg font-semibold">排除路由</h3>
          <div className="flex gap-2">
            <Input
              value={newRoute}
              onChange={(e) => setNewRoute(e.target.value)}
              placeholder={`要排除的站内页面, 例如 /friend-link`}
              labelPlacement="outside"
            />

            <Button
              isIconOnly
              variant="flat"
              color="primary"
              onPress={addExcludedRoute}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {excludedRoutes.map((route) => (
              <Chip
                key={route}
                onClose={() => removeRoute(route)}
                variant="flat"
                color="secondary"
              >
                {route}
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-lg font-semibold">排除域名</h3>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder={`例如 touchgal.io, nav.kungal.com`}
              labelPlacement="outside"
            />

            <Button
              isIconOnly
              variant="flat"
              color="primary"
              onPress={addExcludedDomain}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {excludedDomains.map((domain) => (
              <Chip
                key={domain}
                onClose={() => removeDomain(domain)}
                variant="flat"
                color="secondary"
              >
                {domain}
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
