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
    <div className="text-light-400">
      <div className="border-light-100 flex w-full items-center justify-between border px-3 py-3 md:px-10">
        <Image
          src="/logo.png"
          alt="Logo"
          width={100}
          height={100}
          className="hidden w-[70px] lg:block lg:w-[100px]"
        />
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-light-500 text-light-50 h-10 rounded px-4 font-semibold lg:hidden"
        >
          <Icon name="hamburger" />
        </button>
        <div
          className={`${
            isMenuOpen ? '' : '-translate-x-[95vw]'
          } text-black bg-light-100 absolute left-0 top-0 z-20 h-[100vh] w-[50%] transition-all duration-1000 ease-in-out md:hidden`}
        >
          <div className="">
            <div className="flex items-center justify-center py-6">
              <Image src="/logo.png" alt="Logo" width={100} height={100} className="w-[100px]" />
            </div>
            <hr className="text-light-200" />
            <div className="px-4">
              <ul className="mt-6 space-y-4">
                {
                  links.map((link: { name: string; icon: string; href: string }) => (
                    <li key={link.name} className="flex items-center gap-2 px-2 py-2">
                      <Icon name={link.icon} />
                      <Link href={link.href}>{link.name}</Link>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`${
            isMenuOpen ? 'translate-x-0 opacity-50' : 'translate-x-[95vw] opacity-0'
          } text-black duration-5000 absolute right-0 top-0 z-20 h-[100vh] w-[55%] transition-opacity ease-in-out md:hidden`}
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
          <button className="bg-light-500 text-light-50 h-10 rounded px-4 font-semibold">
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
