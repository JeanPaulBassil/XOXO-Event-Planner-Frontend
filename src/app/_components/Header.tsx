'use client'
import React, { ReactElement, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar } from '@nextui-org/avatar'
import Icon from './Icon'
import { Divider, Popover, PopoverContent, PopoverTrigger, Spinner } from '@nextui-org/react'
import { ChevronDown, LogOut } from 'lucide-react'
import { get } from 'http'
import { clearTokens, DecodedToken, getAuthenticatedUser } from '@/utils/auth'
import { set } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toCapitalCase } from '@/utils/string'

type Props = {
  children: React.ReactNode
}

export interface IconMenuItem {
  icon: ReactElement
  label: string
  link?: string
  action?: () => void
  divider?: boolean
  matcher?: string
}

const Header = ({ children }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [user, setUser] = React.useState<DecodedToken | null>(null)
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getAuthenticatedUser()
      if (!user) {
        router.push('/signin')
      }
      setUser(user)
      setLoading(false)
    }
    fetchUser()
  }, [])

  if (loading)
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner />
      </div>
    )

  const links = [
    { name: 'Dashboard', icon: 'dashboard', href: '/' },
    { name: 'Events', icon: 'confetti', href: '/events' },
    { name: 'Guests', icon: 'guests', href: '/guests' },
    { name: 'Calendars', icon: 'calendars', href: '/calendars' },
    { name: 'Users', icon: 'users', href: '/users' },
  ]

  const IconMenuItems: IconMenuItem[] = [
    {
      icon: (
        <LogOut className="text-light-300 group-hover:text-light-400" width={20} strokeWidth={1} />
      ),
      label: 'Logout',
      action: async () => {
        clearTokens()
        router.push('/login')
      },
      divider: false,
    },
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
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 px-2 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon name={link.icon} />
                      <p>{link.name}</p>
                    </Link>
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
          <Link href="/events/create">
            <button className="h-10 rounded bg-light-500 px-4 font-semibold text-light-50">
              <p className="hidden md:block">New Event</p>
              <div className="md:hidden">
                <Icon name="plus" />
              </div>
            </button>
          </Link>
          <Popover
            placement="bottom-end"
            offset={20}
            classNames={{
              content: 'p-0',
            }}
          >
            <PopoverTrigger>
              <div className="flex flex-row items-center gap-2 hover:cursor-pointer">
                <Avatar
                  name={toCapitalCase(user?.username || '').slice(0, 1)}
                  isBordered
                  color="danger"
                  size="md"
                  className="text-lg font-bold"
                />

                <ChevronDown className="text-secondary-600 dark:text-secondary-50" width={14} />
              </div>
            </PopoverTrigger>
            <PopoverContent className="bg-light-50 min-w-60 rounded-md">
              <div className="flex w-full flex-col p-2">
                <div className="flex flex-col items-center px-3 py-1">
                  <Avatar
                    name={toCapitalCase(user?.username || '').slice(0, 1)}
                    isBordered
                    color="danger"
                    className="text-lg font-bold"
                  />
                  <p className="mt-3 text-small font-medium text-secondary-700 dark:text-secondary-50">
                    {toCapitalCase(user?.username || '')}
                  </p>
                  <div className="mt-2 text-small text-primary-500">
                    {toCapitalCase(user?.role.toLowerCase() || '')}
                  </div>
                </div>
                {IconMenuItems.map((item, index) => (
                  <div className="mt-1" key={index}>
                    {item.divider && (
                      <Divider className="my-2 bg-secondary-100 dark:bg-secondary-900" />
                    )}
                    {item.action ? (
                      <button
                        className="duration-100 group flex w-full flex-row items-center space-x-2 px-4 py-2 transition-colors ease-out hover:cursor-pointer hover:bg-secondary-100/75 dark:hover:bg-secondary-900"
                        onClick={item.action}
                      >
                        {item.icon}
                        <p className="group-hover:text-secondary-950 text-medium text-secondary-800 dark:text-secondary-200 dark:group-hover:text-secondary-50">
                          {item.label}
                        </p>
                      </button>
                    ) : (
                      <Link
                        href={item.link ?? ''}
                        className="duration-100 group flex w-full flex-row items-center space-x-2 px-4 py-1.5 transition-colors ease-out hover:cursor-pointer hover:bg-secondary-100/75 dark:hover:bg-secondary-900"
                      >
                        {item.icon}
                        <p className="group-hover:text-secondary-950 text-medium text-secondary-800 dark:text-secondary-200 dark:group-hover:text-secondary-50">
                          {item.label}
                        </p>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {children}
    </div>
  )
}

type EventModalProps = {
  isOpen: boolean
  onClose: () => void
}

interface SectionProps {
  form: React.ReactNode
  title: string
  description: string
}

const Section = (props: SectionProps) => {
  const { title, description, form } = props
  return (
    <div
      className={`flex flex-col items-center justify-start md:p-8 md:py-16 lg:flex-row lg:items-center`}
    >
      {/* Left Part */}
      <div className={`flex flex-col items-stretch text-center md:w-[350px]`}>
        <h3 className="text-secondary-950 text-base dark:text-secondary-50">{title}</h3>
        <p className="mt-0.5 text-wrap text-small text-light-300 lg:w-[90%]">{description}</p>
      </div>
      {/* Right Part */}
      {form}
    </div>
  )
}

export default Header
