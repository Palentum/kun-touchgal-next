'use client'

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

interface Props {
  children: React.ReactNode
}

export const KunReCaptchaProvider = ({ children }: Props) => {
  return (
    <GoogleReCaptchaProvider
      language="zh"
      useRecaptchaNet={true}
      reCaptchaKey={process.env.NEXT_PUBLIC_KUN_RECAPTCHA_SITE_KEY!}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}
