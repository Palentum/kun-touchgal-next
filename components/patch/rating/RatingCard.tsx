'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button, Chip, Tooltip, Textarea } from '@heroui/react'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@heroui/modal'
import { Eye, EyeOff, Pencil, Star, Trash2, TriangleAlert } from 'lucide-react'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { formatTimeDifference } from '~/utils/time'
import { RatingLikeButton } from './RatingLike'
import { useUserStore } from '~/store/userStore'
import toast from 'react-hot-toast'
import { kunFetchDelete, kunFetchPost } from '~/utils/kunFetch'
import { RatingModal } from './RatingModal'
import {
  KUN_GALGAME_RATING_RECOMMEND_MAP,
  KUN_GALGAME_RATING_PLAY_STATUS_MAP,
  KUN_GALGAME_RATING_SPOILER_MAP
} from '~/constants/galgame'
import type { KunPatchRating } from '~/types/api/galgame'

interface Props {
  rating: KunPatchRating
  patchId: number
  onRatingUpdated: (rating: KunPatchRating) => void
  onDeleted: (ratingId: number) => void
}

const getRecommendColor = (recommend: string) => {
  switch (recommend) {
    case 'strong_yes':
      return 'success'
    case 'yes':
      return 'primary'
    case 'neutral':
      return 'default'
    case 'no':
      return 'warning'
    case 'strong_no':
      return 'danger'
    default:
      return 'default'
  }
}

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-success'
  if (score >= 6) return 'text-primary'
  if (score >= 4) return 'text-warning'
  return 'text-danger'
}

export const RatingCard = ({
  rating,
  patchId,
  onRatingUpdated,
  onDeleted
}: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user } = useUserStore((state) => state)
  const [isShowSummary, setIsShowSummary] = useState(
    rating.spoilerLevel === 'none'
  )
  const {
    isOpen: isOpenReport,
    onOpen: onOpenReport,
    onClose: onCloseReport
  } = useDisclosure()
  const [reportValue, setReportValue] = useState('')
  const [reporting, setReporting] = useState(false)

  const canEdit = user.uid === rating.user.id || user.role >= 3

  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete
  } = useDisclosure()
  const [deleting, setDeleting] = useState(false)
  const handleSubmitReport = async () => {
    if (!reportValue.trim()) {
      toast.error('请填写举报原因')
      return
    }

    setReporting(true)
    const res = await kunFetchPost<KunResponse<{}>>('/patch/rating/report', {
      ratingId: rating.id,
      patchId,
      content: reportValue.trim()
    })
    if (typeof res === 'string') {
      toast.error(res)
    } else {
      setReportValue('')
      onCloseReport()
      toast.success('提交举报成功')
    }
    setReporting(false)
  }

  const handleDeleteRating = async () => {
    if (!canEdit) {
      toast.error('您没有权限删除该评价')
      return
    }

    setDeleting(true)
    await kunFetchDelete<KunResponse<{}>>('/patch/rating', {
      ratingId: rating.id
    })
    setDeleting(false)

    onDeleted(rating.id)
    onCloseDelete()
    toast.success('Galgame 评价删除成功')
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex items-start justify-between gap-3 pb-0">
        <KunUser
          user={rating.user}
          userProps={{
            name: rating.user.name,
            description: formatTimeDifference(rating.created),
            avatarProps: {
              src: rating.user.avatar,
              size: 'sm'
            }
          }}
        />
        <div
          className={`flex items-center gap-1 ${getScoreColor(rating.overall)}`}
        >
          <Star className="size-5" fill="currentColor" />
          <span className="text-2xl font-bold">{rating.overall}</span>
        </div>
      </CardHeader>

      <CardBody className="pt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Chip
            color={getRecommendColor(rating.recommend)}
            variant="flat"
            size="sm"
          >
            {KUN_GALGAME_RATING_RECOMMEND_MAP[rating.recommend]}
          </Chip>
          <Chip color="secondary" variant="flat" size="sm">
            {KUN_GALGAME_RATING_PLAY_STATUS_MAP[rating.playStatus]}
          </Chip>
        </div>

        {rating.shortSummary && (
          <>
            {rating.spoilerLevel !== 'none' && !isShowSummary ? (
              <div
                className="relative p-3 rounded-lg bg-warning-50 dark:bg-warning-100/10 border border-warning-200 dark:border-warning-500/20 cursor-pointer hover:bg-warning-100 dark:hover:bg-warning-100/20 transition-colors"
                onClick={() => setIsShowSummary(true)}
              >
                <div className="flex items-center gap-2 text-warning-600 dark:text-warning-500">
                  <EyeOff className="size-4" />
                  <span className="text-sm font-medium">
                    {KUN_GALGAME_RATING_SPOILER_MAP[rating.spoilerLevel]}
                  </span>
                </div>
                <p className="text-xs text-warning-500 dark:text-warning-400 mt-1">
                  点击显示评价内容
                </p>
              </div>
            ) : (
              <div className="relative">
                {rating.spoilerLevel !== 'none' && (
                  <button
                    onClick={() => setIsShowSummary(false)}
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-default-100 hover:bg-default-200 transition-colors"
                  >
                    <Eye className="size-3 text-default-500" />
                  </button>
                )}
                <p className="text-sm text-default-800 whitespace-pre-wrap leading-relaxed">
                  {rating.shortSummary}
                </p>
              </div>
            )}
          </>
        )}
        <div className="flex items-center justify-between">
          <RatingLikeButton rating={rating} />

          <div className="flex gap-1">
            {user.uid > 0 && user.uid !== rating.user.id && (
              <Tooltip content="举报">
                <Button
                  variant="light"
                  isIconOnly
                  size="sm"
                  onPress={onOpenReport}
                  className="text-warning"
                >
                  <TriangleAlert className="size-4" />
                </Button>
              </Tooltip>
            )}
            {canEdit && (
              <>
                <Tooltip content="编辑">
                  <Button
                    variant="light"
                    isIconOnly
                    size="sm"
                    onPress={onOpen}
                    className="text-default-500"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="删除">
                  <Button
                    variant="light"
                    isIconOnly
                    size="sm"
                    onPress={onOpenDelete}
                    className="text-danger"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </CardBody>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <RatingModal
          isOpen={isOpen}
          onClose={onClose}
          patchId={patchId}
          onSuccess={onRatingUpdated}
          initial={rating}
        />
      </Modal>

      <Modal isOpen={isOpenDelete} onClose={onCloseDelete} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">删除评价</ModalHeader>
          <ModalBody>
            <p>
              您确定要删除这条评价吗？这将会导致您发布评价获得的萌萌点被扣除，该操作不可撤销。
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseDelete}>
              取消
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteRating}
              disabled={deleting}
              isLoading={deleting}
            >
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenReport} onClose={onCloseReport}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">举报评价</ModalHeader>
          <ModalBody>
            <Textarea
              label={`举报 ${rating.shortSummary.slice(0, 20) || `总分 ${rating.overall}/10`}`}
              isRequired
              placeholder="请填写举报原因"
              value={reportValue}
              onValueChange={setReportValue}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseReport}>
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleSubmitReport}
              isDisabled={reporting}
              isLoading={reporting}
            >
              提交
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  )
}
