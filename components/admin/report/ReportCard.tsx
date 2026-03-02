'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  useDisclosure
} from '@heroui/react'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import { formatDate } from '~/utils/time'
import { ReportHandler } from './ReportHandler'
import type { AdminReport } from '~/types/api/admin'
import { kunFetchPost } from '~/utils/kunFetch'
import toast from 'react-hot-toast'

interface Props {
  report: AdminReport
}

export const ReportCard = ({ report }: Props) => {
  const [reportStatus, setReportStatus] = useState(report.status)
  const [handleContent, setHandleContent] = useState('')
  const [actionType, setActionType] = useState<'delete' | 'reject'>('delete')
  const [updating, setUpdating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const openActionModal = (action: 'delete' | 'reject') => {
    setActionType(action)
    setHandleContent('')
    onOpen()
  }

  const handleUpdateReport = async () => {
    setUpdating(true)
    const res = await kunFetchPost<KunResponse<{}>>('/admin/report/handle', {
      messageId: report.id,
      action: actionType,
      commentId: report.reportedCommentId,
      content: handleContent.trim()
    })
    if (typeof res === 'string') {
      toast.error(res)
    } else {
      setReportStatus(actionType === 'reject' ? 3 : 2)
      onClose()
      setHandleContent('')
      toast.success(actionType === 'reject' ? '驳回举报成功!' : '处理举报成功!')
    }
    setUpdating(false)
  }

  const statusColor: 'success' | 'danger' | 'warning' =
    reportStatus === 0 ? 'danger' : reportStatus === 3 ? 'warning' : 'success'
  const statusLabel =
    reportStatus === 0 ? '未处理' : reportStatus === 3 ? '已驳回' : '已处理'

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <KunAvatar
                uid={report.sender!.id}
                avatarProps={{
                  name: report.sender!.name,
                  src: report.sender!.avatar
                }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{report.sender?.name}</h2>
                  <span className="text-small text-default-500">
                    {formatDate(report.created, {
                      isPrecise: true,
                      isShowYear: true
                    })}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{report.content}</p>

                <div className="flex items-center gap-4 mt-2">
                  <Chip color={statusColor} variant="flat">
                    {statusLabel}
                  </Chip>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={() => openActionModal('delete')}
                    isDisabled={reportStatus !== 0}
                  >
                    删除
                  </Button>
                  <Button
                    size="sm"
                    color="warning"
                    variant="flat"
                    onPress={() => openActionModal('reject')}
                    isDisabled={reportStatus !== 0}
                  >
                    驳回
                  </Button>
                </div>
              </div>
            </div>

            <ReportHandler initialReport={report} />
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {actionType === 'reject' ? '驳回举报' : '处理举报'}
          </ModalHeader>
          <ModalBody>
            <Textarea
              value={handleContent}
              label="反馈回复内容 (可选)"
              onChange={(e) => setHandleContent(e.target.value)}
              placeholder={
                actionType === 'reject'
                  ? '留空将使用默认回复：已驳回'
                  : '留空将使用默认回复：已处理'
              }
              minRows={2}
              maxRows={8}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setHandleContent('')
                onClose()
              }}
            >
              取消
            </Button>
            <Button
              color={actionType === 'reject' ? 'warning' : 'danger'}
              onPress={handleUpdateReport}
              isDisabled={updating}
              isLoading={updating}
            >
              {actionType === 'reject' ? '确认驳回' : '确认删除'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
