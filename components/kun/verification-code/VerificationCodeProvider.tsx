import { KunReCaptchaProvider } from '~/components/kun/ReCaptchaProvider'
import { EmailVerification } from './Code'

interface Props {
  username: string
  email: string
  type: 'register' | 'email'
}

export const VerificationCodeProvider = ({ username, email, type }: Props) => {
  return (
    <KunReCaptchaProvider>
      <EmailVerification username={username} email={email} type={type} />
    </KunReCaptchaProvider>
  )
}
