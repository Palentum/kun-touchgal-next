import { NavbarBrand } from '@nextui-org/navbar'
import { kunMoyuMoe } from '~/config/moyu-moe'
import Image from 'next/image'
import Link from 'next/link'

export const KunTopBarBrand = () => {
  return (
    <NavbarBrand className="hidden mr-4 grow-0 sm:flex">
      <Link className="flex items-center" href="/">
        <Image
          src="/favicon.webp"
          alt={kunMoyuMoe.titleShort}
          width={50}
          height={50}
          priority
        />
        <p className="ml-4 mr-2 font-bold text-inherit">
          {kunMoyuMoe.creator.name}
        </p>
      </Link>
    </NavbarBrand>
  )
}
