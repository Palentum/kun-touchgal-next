import { KunReCaptchaProvider } from '~/components/kun/ReCaptchaProvider'
import { LoginForm } from './Login'

export const LoginProvider = () => {
  return (
    <KunReCaptchaProvider>
      <LoginForm />
    </KunReCaptchaProvider>
  )
}
