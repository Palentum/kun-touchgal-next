'use client'

import React from 'react'
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure
} from '@nextui-org/react'
import { Video } from 'lucide-react'

interface VideoInsertButtonProps {
  onInsert: (url: string) => void
}

export function VideoInsertButton({ onInsert }: VideoInsertButtonProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [videoUrl, setVideoUrl] = React.useState('')

  const handleInsert = () => {
    if (videoUrl) {
      onInsert(videoUrl)
      setVideoUrl('')
      onClose()
    }
  }

  return (
    <>
      <Button
        variant="flat"
        color="primary"
        startContent={<Video size={20} />}
        onPress={onOpen}
      >
        Insert Video
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Insert Video</ModalHeader>
          <ModalBody>
            <Input
              label="Video URL"
              placeholder="Enter video URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleInsert}>
              Insert
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
