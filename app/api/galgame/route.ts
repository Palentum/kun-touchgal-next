import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { galgameSchema } from '~/validations/galgame'
import {
  ALL_SUPPORTED_LANGUAGE,
  ALL_SUPPORTED_PLATFORM,
  ALL_SUPPORTED_TYPE
} from '~/constants/resource'
import { getPatchVisibilityWhere } from '~/app/api/utils/getPatchVisibilityWhere'
import { getGalgame } from './service'
export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, galgameSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  if (
    !ALL_SUPPORTED_TYPE.includes(input.selectedType) ||
    !ALL_SUPPORTED_LANGUAGE.includes(input.selectedLanguage) ||
    !ALL_SUPPORTED_PLATFORM.includes(input.selectedPlatform)
  ) {
    return NextResponse.json('请选择我们支持的 Galgame 排序类型')
  }

  const visibilityWhere = await getPatchVisibilityWhere(req)

  const response = await getGalgame(input, visibilityWhere)
  return NextResponse.json(response)
}
