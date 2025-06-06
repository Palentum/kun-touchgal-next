import { TwoFactor } from '~/components/login/2FA'
import { kunMetadata } from './metadata'
import { LoginContainer } from '~/components/login/Container'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Kun() {
  return (
    <LoginContainer title="两步验证">
      <TwoFactor />
    </LoginContainer>
  )
}
