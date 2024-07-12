'use client'
import React, { ReactElement, useEffect } from 'react'
import Image from 'next/image'
import { Avatar } from '@nextui-org/avatar'
import Icon from './Icon'
import {
  Button,
  Divider,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Link,
  NavbarMenu,
  NavbarMenuItem,
  menu,
} from '@nextui-org/react'
import {
  Cake,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  LucidePlusCircle,
  Menu,
  Plus,
  PlusCircleIcon,
  PlusIcon,
  Users,
  Users2,
  X,
} from 'lucide-react'
import { clearTokens, DecodedToken, getAuthenticatedUser } from '@/utils/auth'
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
    {
      name: 'Events',
      icon: (
        <Cake className="text-light-300 group-hover:text-light-400" size={28} strokeWidth={1} />
      ),
      href: '/events',
    },
    {
      name: 'Guests',
      icon: (
        <Users className="text-light-300 group-hover:text-light-400" size={28} strokeWidth={1} />
      ),
      href: '/guests',
    },
    {
      name: 'Calendars',
      icon: (
        <Calendar className="text-light-300 group-hover:text-light-400" size={28} strokeWidth={1} />
      ),
      href: '/',
    },
    {
      name: 'Users',
      icon: (
        <Users2 className="text-light-300 group-hover:text-light-400" size={28} strokeWidth={1} />
      ),
      href: '/users',
    },
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
        <Navbar onMenuOpenChange={setIsMenuOpen} shouldHideOnScroll position='static' maxWidth="full">
          <NavbarContent>
            <NavbarMenuToggle
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              icon={isMenuOpen ? <X color="red" /> : <Menu color="red" />}
              className="lg:hidden"
            />
            <NavbarBrand>
              <Image
                src="/logo.png"
                alt="Logo"
                width={100}
                height={100}
                className="hidden xl:block xl:w-[100px]"
              />
              <h1 className="text-2xl font-bold text-light-500 xl:hidden">XOXO</h1>
            </NavbarBrand>
          </NavbarContent>

          <NavbarContent className="hidden gap-4 lg:flex" justify="center">
            {links.map((link: { name: string; href: string }) => (
              <NavbarItem key={link.name}>
                <Link href={link.href} color="foreground">
                  {link.name}
                </Link>
              </NavbarItem>
            ))}
          </NavbarContent>
          <NavbarContent justify="end">
            <Link href="/events/create">
              <Button
                color="danger"
                radius="sm"
                size="md"
                variant="solid"
                startContent={<Plus />}
                className="hidden text-lg font-medium lg:flex"
              >
                New Event
              </Button>
              <Button
                color="danger"
                radius="sm"
                size="md"
                variant="solid"
                className="lg:hidden"
                isIconOnly
              >
                <PlusIcon />
              </Button>
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
                    size="sm"
                    className="text-lg font-bold"
                  />

                  <ChevronDown className="text-secondary-600 dark:text-secondary-50" width={14} />
                </div>
              </PopoverTrigger>
              <PopoverContent className="min-w-60 rounded-md bg-light-50">
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
          </NavbarContent>
          <NavbarMenu className="h-screen w-screen bg-light-50 px-10 md:px-[70px] py-[50px]">
            {links.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  color="foreground"
                  className="w-full items-center gap-2 text-light-500"
                  href={item.href}
                  size="lg"
                >
                  {item.icon}
                  {item.name}
                </Link>
              </NavbarMenuItem>
            ))}
          </NavbarMenu>
        </Navbar>
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

export default Header
