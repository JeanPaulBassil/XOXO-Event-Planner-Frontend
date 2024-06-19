'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar } from '@nextui-org/avatar'
import Icon from './Icon'
import { usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

const Header = ({ children }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const currentPage = usePathname().split('/')[1]

  const links = [
    { name: 'Dashboard', icon: 'dashboard', href: '/' },
    { name: 'Guests', icon: 'guests', href: '/guests' },
    { name: 'Calendars', icon: 'calendars', href: '/calendars' },
    { name: 'Users', icon: 'users', href: '/users' },
  ]

  return (
    <div className="overflow-x-hidden text-light-400">
      <div className="flex w-full items-center justify-between border border-light-100 px-3 py-3 md:px-10">
        <Image
          src="/logo.png"
          alt="Logo"
          width={100}
          height={100}
          className="hidden w-[70px] lg:block lg:w-[100px]"
        />
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-10 rounded bg-light-500 px-4 font-semibold text-light-50 lg:hidden"
        >
          <Icon name="hamburger" />
        </button>
        <div
          className={`${
            isMenuOpen ? '' : '-translate-x-full'
          } text-black fixed left-0 top-0 z-20 h-full w-[50%] bg-light-100 transition-transform duration-1000 ease-in-out md:hidden`}
        >
          <div>
            <div className="flex items-center justify-center py-6">
              <Image src="/logo.png" alt="Logo" width={100} height={100} className="w-[100px]" />
            </div>
            <hr className="text-light-200" />
            <div className="px-4">
              <ul className="mt-6 space-y-4">
                {links.map((link: { name: string; icon: string; href: string }) => (
                  <li key={link.name} className="flex items-center gap-2 px-2 py-2">
                    <Icon name={link.icon} />
                    <Link href={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`${
            isMenuOpen ? 'translate-x-0 opacity-50' : 'translate-x-full opacity-0'
          } text-black fixed right-0 top-0 z-10 h-full w-[55%] transition-opacity ease-in-out md:hidden`}
        ></div>
        <div className="flex items-center gap-4 text-base font-medium md:gap-8">
          <nav className="hidden gap-9 lg:flex">
            <ul className="flex space-x-10">
              {links.map((link: { name: string; icon: string; href: string }) => (
                <li key={link.name}>
                  <Link href={link.href}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <button className="h-10 rounded bg-light-500 px-4 font-semibold text-light-50">
            <p className="hidden md:block">New Event</p>
            <div className="md:hidden">
              <Icon name="plus" />
            </div>
          </button>
          <Avatar name="Jp" isBordered color="danger" />
        </div>
      </div>
      {children}
    </div>
  )
}

export default Header
