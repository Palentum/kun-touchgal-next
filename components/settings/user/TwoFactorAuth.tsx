'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Chip,
  useDisclosure
} from '@nextui-org/react'
import { useUserStore } from '~/store/userStore'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { kunMoyuMoe } from '~/config/moyu-moe'
import * as QRCode from 'qrcode'
import { Totp } from 'time2fa'
import { useMounted } from '~/hooks/useMounted'
import { kunErrorHandler } from '~/utils/kunErrorHandler'

interface AuthStatus {
  isEnabled2FA: boolean
  hasSecret: boolean
  secret: string
  authUrl: string
  qrCodeUrl: string
  token: string
  backupCode: string[]
}

export const TwoFactorAuth = () => {
  const user = useUserStore((state) => state.user)
  const isMounted = useMounted()

  const initialStatus: AuthStatus = {
    isEnabled2FA: false,
    hasSecret: false,
    secret: '',
    authUrl: '',
    qrCodeUrl: '',
    token: '',
    backupCode: [] as string[]
  }
  const [authStatus, setAuthStatus] = useState<AuthStatus>(initialStatus)

  const [isLoading, setIsLoading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isBackupOpen,
    onOpen: onBackupOpen,
    onClose: onBackupClose
  } = useDisclosure()

  useEffect(() => {
    const check2FAStatus = async () => {
      const response = await kunFetchGet<{
        enabled: boolean
        hasSecret: boolean
      }>('/user/setting/2fa/status')
      setAuthStatus({
        ...authStatus,
        isEnabled2FA: response.enabled,
        hasSecret: response.hasSecret
      })
    }

    if (isMounted) {
      check2FAStatus()
    }
  }, [isMounted])

  useEffect(() => {
    if (authStatus.authUrl) {
      QRCode.toDataURL(authStatus.authUrl)
        .then((url) => {
          setAuthStatus({ ...authStatus, qrCodeUrl: url })
        })
        .catch((err) => {
          console.error('Error generating QR code:', err)
        })
    }
  }, [authStatus.authUrl])

  const generateSecret = async () => {
    if (!user.uid) {
      toast.error('请登陆后再启用 2FA')
      return
    }

    setIsLoading(true)
    const key = Totp.generateKey({
      issuer: kunMoyuMoe.titleShort,
      user: user.name || user.uid.toString()
    })

    const res = await kunFetchPost<KunResponse<{}>>(
      '/user/setting/2fa/save-secret',
      { secret: key.secret }
    )
    setIsLoading(false)

    kunErrorHandler(res, () => {
      setAuthStatus({
        ...authStatus,
        secret: key.secret,
        authUrl: key.url,
        hasSecret: true
      })
      onOpen()
      toast.success('密钥已生成，请使用身份验证器应用扫描二维码')
    })
  }

  const verifyAndEnable = async () => {
    if (!authStatus.token) {
      toast.error('请输入验证码')
      return
    }

    setIsLoading(true)
    const isValid = Totp.validate({
      passcode: authStatus.token,
      secret: authStatus.secret
    })
    if (!isValid) {
      toast.error('验证码无效，请重试')
      setIsLoading(false)
      return
    }

    const res = await kunFetchPost<KunResponse<{ backupCode: string[] }>>(
      '/user/setting/2fa/enable',
      { token: authStatus.token }
    )
    setIsLoading(false)

    kunErrorHandler(res, (value) => {
      setAuthStatus({
        ...authStatus,
        isEnabled2FA: true,
        backupCode: value.backupCode
      })
      onClose()
      onBackupOpen()
      toast.success('两步验证已启用')
    })
  }

  const disable2FA = async () => {
    setIsLoading(true)
    const res = await kunFetchPost<KunResponse<{}>>('/user/setting/2fa')
    setIsLoading(false)

    kunErrorHandler(res, () => {
      setAuthStatus(initialStatus)
      toast.success('两步验证已禁用')
    })
  }

  return (
    <>
      <Card className="w-full text-sm">
        <CardHeader>
          <h2 className="text-xl font-medium">两步验证</h2>
        </CardHeader>
        <CardBody className="py-0 space-y-4">
          <div>
            <p>
              两步验证可以为您的账户提供额外的安全保护。启用后，每次登录时除了密码外，
              还需要输入身份验证器应用生成的验证码。
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p>是否启用两步验证</p>
            <Switch
              size="lg"
              color="primary"
              isSelected={authStatus.isEnabled2FA}
              isDisabled={isLoading}
              onValueChange={(value) => {
                if (value) {
                  generateSecret()
                } else {
                  disable2FA()
                }
              }}
            />
          </div>
        </CardBody>

        <CardFooter className="flex-wrap">
          <p className="text-default-500">
            启用两步验证后，即使密码泄露，他人也无法登录您的账户。
          </p>
        </CardFooter>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>设置两步验证</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">步骤 1: 扫描二维码</h3>
                <p className="text-sm text-default-500">
                  使用 Google Authenticator、Microsoft Authenticator
                  或其他身份验证器应用扫描下方的二维码。
                </p>
                {authStatus.qrCodeUrl && (
                  <div className="flex justify-center my-4">
                    <img
                      src={authStatus.qrCodeUrl}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">步骤 2: 输入验证码</h3>
                <p className="text-sm text-default-500">
                  打开身份验证器应用，输入显示的 6 位验证码。
                </p>
                <Input
                  value={authStatus.token}
                  onValueChange={(value) =>
                    setAuthStatus({ ...authStatus, token: value })
                  }
                  placeholder="6位验证码"
                  maxLength={6}
                  className="text-lg tracking-widest text-center"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">密钥</h3>
                <p className="text-sm text-default-500">
                  如果无法扫描二维码，您可以手动将此密钥输入到身份验证器应用中。
                </p>
                <div className="flex gap-2">
                  <Input
                    value={authStatus.secret}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => {
                      navigator.clipboard.writeText(authStatus.secret)
                      toast.success('密钥已复制到剪贴板')
                    }}
                  >
                    复制
                  </Button>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="primary"
              onPress={verifyAndEnable}
              isLoading={isLoading}
              isDisabled={!authStatus.token}
            >
              验证并启用
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isBackupOpen} onClose={onBackupClose} size="lg">
        <ModalContent>
          <ModalHeader>备用验证码</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-default-500">
                请保存这些备用验证码，每个代码只能使用一次。如果您无法使用身份验证器应用，可以使用这些备用码登录。
              </p>
              <div className="grid grid-cols-2 gap-2">
                {authStatus.backupCode.map((code, index) => (
                  <Chip
                    key={index}
                    className="p-2 font-mono text-center"
                    variant="flat"
                  >
                    {code}
                  </Chip>
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={() => {
                navigator.clipboard.writeText(authStatus.backupCode.join('\n'))
                toast.success('备用验证码已复制到剪贴板')
              }}
            >
              复制所有代码
            </Button>
            <Button color="primary" onPress={onBackupClose}>
              完成
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
