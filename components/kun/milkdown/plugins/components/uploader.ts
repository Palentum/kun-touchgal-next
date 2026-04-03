import { Decoration } from '@milkdown/prose/view'
import { kunFetchFormData } from '~/utils/kunFetch'
import { resizeImage } from '~/utils/resizeImage'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import type { Uploader } from '@milkdown/plugin-upload'
import type { Node } from '@milkdown/prose/model'

export const kunUploader: Uploader = async (files, schema) => {
  const images: File[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files.item(i)
    if (!file) {
      continue
    }

    if (!file.type.startsWith('image/')) {
      continue
    }

    images.push(file)
  }

  // @ts-expect-error It works fine:)
  const nodes: Node[] = await Promise.all(
    images.map(async (image) => {
      const formData = new FormData()
      const miniImage = await resizeImage(image, 1920, 1080)
      formData.append('image', miniImage)

      const res = await kunFetchFormData<
        KunResponse<{
          imageLink: string
        }>
      >('/user/image', formData)
      const alt = image.name
      let uploadedNode: Node | undefined

      kunErrorHandler(res, (value) => {
        uploadedNode = schema.nodes.image.createAndFill({
          src: value.imageLink,
          alt
        }) as Node
      })

      return uploadedNode
    })
  )

  return nodes
}

export const kunUploadWidgetFactory = (
  pos: number,
  spec: Parameters<typeof Decoration.widget>[2]
) => {
  const widgetDOM = document.createElement('span')
  widgetDOM.textContent = '图片正在上传中'
  widgetDOM.style.color = '#006fee'
  return Decoration.widget(pos, widgetDOM, spec)
}
