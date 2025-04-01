'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Chip,
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
import { Plus, Folder } from 'lucide-react'
import { kunFetchGet, kunFetchPost, kunFetchPut } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import type { UserFavoritePatchFolder } from '~/types/api/user'

interface Props {
  patchId: number
  isOpen: boolean
  onClose: () => void
}

export const FavoriteModal = ({ patchId, isOpen, onClose }: Props) => {
  const [folders, setFolders] = useState<UserFavoritePatchFolder[]>([])
  const [isPending, startTransition] = useTransition()
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose
  } = useDisclosure()
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    isPublic: false
  })

  const fetchFolders = async () => {
    const response = await kunFetchGet<UserFavoritePatchFolder[]>(
      '/user/profile/favorite/folder',
      { patchId }
    )
    setFolders(response)
  }

  useEffect(() => {
    if (isOpen) {
      fetchFolders()
    }
  }, [isOpen])

  const handleCreateFolder = async () => {
    startTransition(async () => {
      const res = await kunFetchPost<KunResponse<UserFavoritePatchFolder>>(
        '/user/profile/favorite/folder',
        newFolder
      )
      kunErrorHandler(res, (value) => {
        setFolders([...folders, value])
        toast.success('创建收藏文件夹成功')
        setNewFolder({ name: '', description: '', isPublic: false })
        onCreateClose()
      })
    })
  }

  const handleAddToFolder = async (folderId: number) => {
    startTransition(async () => {
      const res = await kunFetchPut<KunResponse<{ added: boolean }>>(
        `/patch/favorite`,
        { patchId, folderId }
      )
      kunErrorHandler(res, (value) => {
        toast.success(value.added ? '收藏成功' : '取消收藏成功')
        fetchFolders()
      })
    })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <h2>
                <p className="text-lg font-bold">添加到收藏夹</p>
                <p className="text-sm text-default-500">
                  点击文件夹收藏, 再次点击取消收藏
                </p>
              </h2>
              <Button
                startContent={<Plus className="w-4 h-4" />}
                color="primary"
                variant="flat"
                onPress={onCreateOpen}
              >
                创建新收藏夹
              </Button>

              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  startContent={<Folder className="w-4 h-4" />}
                  variant="bordered"
                  fullWidth
                  className="justify-between"
                  onPress={() => handleAddToFolder(folder.id)}
                >
                  <span>{folder.name}</span>
                  <Chip size="sm">
                    {folder.isAdd
                      ? '本游戏已添加'
                      : `${folder._count.patch} 个游戏`}
                  </Chip>
                </Button>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
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
            <Button color="danger" variant="light" onPress={onCreateClose}>
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
