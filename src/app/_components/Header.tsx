'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar } from '@nextui-org/avatar'
import Icon from './Icon'
import { usePathname } from 'next/navigation'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/modal'
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  DatePicker,
  DateRangePicker,
  DateValue,
  Input,
  Textarea,
  TimeInput,
} from '@nextui-org/react'
import { Controller, useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import toast from 'react-hot-toast'
import Joi from 'joi'
import { EventCategory } from '@/api/models/Event.model'
import { useEvents } from '../(home)/contexts/EventContext'
import { parseDate, CalendarDate, Time, DateField } from '@internationalized/date'

type Props = {
  children: React.ReactNode
}

const Header = ({ children }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const links = [
    { name: 'Dashboard', icon: 'dashboard', href: '/' },
    { name: 'Events', icon: 'confetti', href: '/events' },
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
                  <li key={link.name}>
                    <Link href={link.href} className="flex items-center gap-2 px-2 py-2" onClick={() => setIsMenuOpen(false)}>
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
                  <Link href={link.href} >
                    {link.name}
                  </Link>
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
          <Avatar name="Jp" isBordered color="danger" />
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
