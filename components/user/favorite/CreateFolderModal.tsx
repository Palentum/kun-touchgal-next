'use client'

import { useState, useTransition } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Checkbox,
  Textarea,
  useDisclosure
} from '@nextui-org/react'
import { Plus } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import type { UserFavoritePatchFolder } from '~/types/api/user'

interface Props {
  onCreateSuccess: (folder: UserFavoritePatchFolder) => void
}

export const CreateFolderModal = ({ onCreateSuccess }: Props) => {
  const [isPending, startTransition] = useTransition()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    isPublic: false
  })

  const handleCreateFolder = async () => {
    startTransition(async () => {
      const res = await kunFetchPost<KunResponse<UserFavoritePatchFolder>>(
        '/user/profile/favorite/folder',
        newFolder
      )
      kunErrorHandler(res, (value) => {
        onCreateSuccess(value)
        toast.success('创建收藏文件夹成功')
        setNewFolder({ name: '', description: '', isPublic: false })
        onClose()
      })
    })
  }

  return (
    <>
      <Button
        startContent={<Plus className="w-4 h-4" />}
        color="primary"
        variant="flat"
        onPress={onOpen}
      >
        创建新收藏夹
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>创建新收藏夹</ModalHeader>
          <ModalBody>
            <Input
              label="名称"
              value={newFolder.name}
              onChange={(e) =>
                setNewFolder({ ...newFolder, name: e.target.value })
              }
            />
            <Textarea
              label="描述"
              value={newFolder.description}
              onChange={(e) =>
                setNewFolder({ ...newFolder, description: e.target.value })
              }
            />
            <Checkbox
              isSelected={newFolder.isPublic}
              onValueChange={(value) =>
                setNewFolder({ ...newFolder, isPublic: value })
              }
            >
              公开收藏夹
            </Checkbox>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleCreateFolder}
              isLoading={isPending}
            >
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
