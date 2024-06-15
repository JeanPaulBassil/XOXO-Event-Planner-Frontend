import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarGroup, AvatarIcon } from '@nextui-org/avatar'

type Props = {
  children: React.ReactNode
}

const Header = ({ children }: Props) => {
  return (
    <div className='text-light-400'>
      <div className="flex w-full items-center justify-between px-10 py-3 border border-b-light-100">
        <Image src="/logo.png" alt="Logo" width={100} height={100} />
        <div className="flex items-center gap-8 text-base font-medium">
          <nav className="flex gap-9">
            <ul className="flex space-x-10">
              <li>
                <Link href="#">Dashboard</Link>
              </li>
              <li>
                <Link href="#">Guests</Link>
              </li>
              <li>
                <Link href="#">Calendars</Link>
              </li>
              <li>
                <Link href="#">Users</Link>
              </li>
            </ul>
          </nav>
          <button className="h-10 bg-light-500 text-light-50 px-4 rounded font-semibold">New Event</button>
          <Avatar name="Jp" isBordered color="danger" />
        </div>
      </div>
      {children}
    </div>
  )
}

export default Header
