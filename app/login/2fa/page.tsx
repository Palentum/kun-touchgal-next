'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Link
} from '@nextui-org/react'
import toast from 'react-hot-toast'
import { useUserStore } from '~/store/userStore'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { UserState } from '~/store/userStore'
import type { KunGalgameStatelessPayload } from '~/app/api/utils/jwt'

export default function Kun() {
  const [token, setToken] = useState('')
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false)
  const router = useRouter()
  const { setUser } = useUserStore()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const checkTempToken = async () => {
      const res = await kunFetchGet<KunResponse<KunGalgameStatelessPayload>>(
        '/api/auth/check-temp-token'
      )
      if (typeof res === 'string') {
        router.push('/login')
      }
    }

    checkTempToken()
  }, [router])

  const handleSubmit = async () => {
    if (!token) {
      toast.error('请输入验证码')
      return
    }

    startTransition(async () => {
      const response = await kunFetchPost<UserState>('/api/auth/verify-2fa', {
        token,
        isBackupCode: isUsingBackupCode
      })

      if (typeof response === 'string') {
        toast.error(response)
      } else {
        setUser(response)
        toast.success('验证成功，欢迎回来！')
        router.push('/')
      }
    })
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">两步验证</h1>
          <p className="text-default-500">
            {isUsingBackupCode
              ? '请输入您的备用验证码'
              : '请输入您的身份验证器应用中显示的验证码'}
          </p>
        </CardHeader>
        <CardBody>
          <form className="space-y-4">
            <Input
              id="token"
              label={isUsingBackupCode ? '备用验证码' : '6位验证码'}
              placeholder={
                isUsingBackupCode ? '输入备用验证码' : '输入6位验证码'
              }
              value={token}
              onChange={(e) => setToken(e.target.value)}
              variant="bordered"
              classNames={{
                input: 'text-center text-lg tracking-widest'
              }}
              maxLength={isUsingBackupCode ? 8 : 6}
            />

            <Button
              type="submit"
              color="primary"
              className="w-full"
              isLoading={isPending}
              isDisabled={isPending}
              onPress={handleSubmit}
            >
              {isPending ? '验证中...' : '验证'}
            </Button>
          </form>
        </CardBody>
        <CardFooter className="justify-center">
          <Link
            as="button"
            color="primary"
            onPress={() => setIsUsingBackupCode(!isUsingBackupCode)}
          >
            {isUsingBackupCode ? '使用身份验证器应用' : '使用备用验证码'}
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
