'use client'

import {
  Card,
  CardBody,
  Button,
  RadioGroup,
  Radio,
  Input,
  Textarea
} from '@nextui-org/react'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { emailTemplates } from '~/constants/email/group-templates'
import { EmailPreview } from './EmailPreview'
import { KunExternalLink } from '~/components/kun/ExternalLink'

export const EmailTemplate = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({})
  const [isSending, setIsSending] = useState(false)

  const currentTemplate = emailTemplates.find((t) => t.id === selectedTemplate)

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value)
    setTemplateVars({})
  }

  const getPreviewContent = () => {
    if (!currentTemplate) {
      return ''
    }

    let content = currentTemplate.template
    Object.entries(templateVars).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })
    return content
  }

  const handleSendEmails = async () => {
    if (!currentTemplate) {
      return
    }

    setIsSending(true)
    const response = await fetch('/api/admin/send-bulk-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId: selectedTemplate,
        variables: templateVars
      })
    })

    setSelectedTemplate('')
    setTemplateVars({})
    setIsSending(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">群发邮件</h3>
            <p className="text-small text-default-500">给所有用户发送邮件</p>
          </div>

          <RadioGroup
            label="请选择邮件模板"
            value={selectedTemplate}
            onValueChange={handleTemplateChange}
          >
            {emailTemplates.map((template) => (
              <Radio key={template.id} value={template.id}>
                {template.name}
              </Radio>
            ))}
          </RadioGroup>

          <>
            <Input
              label="标题"
              placeholder="请输入您的标题"
              value={templateVars.title || ''}
              onChange={(e) =>
                setTemplateVars({ ...templateVars, title: e.target.value })
              }
            />
            <Textarea
              label="内容"
              placeholder="请输入您的内容"
              value={templateVars.content || ''}
              onChange={(e) =>
                setTemplateVars({ ...templateVars, content: e.target.value })
              }
              minRows={4}
            />
            <p className="text-sm">
              内容支持 HTML, 可以使用{' '}
              <KunExternalLink link="https://www.wangeditor.com/demo/get-html.html">
                wangEditor
              </KunExternalLink>
              进行编辑, 编辑完成后复制下方输出的 HTML 即可
            </p>
          </>

          <div className="flex justify-end">
            <Button
              color="secondary"
              endContent={<Mail className="w-4 h-4" />}
              isLoading={isSending}
              onPress={handleSendEmails}
              isDisabled={!currentTemplate}
            >
              向全体用户发送
            </Button>
          </div>
        </CardBody>
      </Card>

      <EmailPreview content={currentTemplate ? getPreviewContent() : ''} />
    </div>
  )
}
