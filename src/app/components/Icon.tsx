import React from 'react'
import Image from 'next/image'

const Icon = ({ name }: { name: string }) => {
  return (
    <Image
      src={`/icons/${name.toLowerCase()}.png`}
      alt={name}
      width={20}
      height={20}
    />
  )
}

export default Icon
