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
  DateRangePicker,
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
import { parseDate, CalendarDate, Time } from '@internationalized/date'

type Props = {
  children: React.ReactNode
}

type FormData = {
  title: string
  category: EventCategory
  price: number
  deposit: number
  description: string
  dateRange: { start: CalendarDate; end: CalendarDate }
  startTime: Time
  endTime: Time
}

const createEventSchema = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().required(),
  price: Joi.number().required(),
  deposit: Joi.number().required(),
  description: Joi.string().required(),
  dateRange: Joi.object({
    start: Joi.required(),
    end: Joi.required(),
  }).required(),
  startTime: Joi.required(),
  endTime: Joi.required(),
})

const Header = ({ children }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const currentPage = usePathname().split('/')[1]
  const { isOpen, onClose, onOpen } = useDisclosure()

  const links = [
    { name: 'Dashboard', icon: 'dashboard', href: '/' },
    { name: 'Events', icon: 'confetti', href: '/events' },
    { name: 'Guests', icon: 'guests', href: '/guests' },
    { name: 'Calendars', icon: 'calendars', href: '/calendars' },
    { name: 'Users', icon: 'users', href: '/users' },
  ]

  return (
    <div className="overflow-x-hidden text-light-400">
      <NewEventModal isOpen={isOpen} onClose={onClose} />
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
                      <Link href={link.href} className='flex items-center gap-2 px-2 py-2'>
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
          <button
            className="h-10 rounded bg-light-500 px-4 font-semibold text-light-50"
            onClick={onOpen}
          >
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

type EventModalProps = {
  isOpen: boolean
  onClose: () => void
}

const NewEventModal = ({ isOpen, onClose }: EventModalProps) => {
  const [level, setLevel] = React.useState(0)
  const { createEvent } = useEvents()

  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: joiResolver(createEventSchema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const newEvent = {
        title: data.title,
        category: data.category,
        price: data.price,
        deposit: data.deposit,
        description: data.description,
        startDate: `${data.dateRange.start.toString()}T${data.startTime.toString()}`,
        endDate: `${data.dateRange.end.toString()}T${data.endTime.toString()}`,
        remaining: data.price - data.deposit,
      }

      await createEvent(newEvent)
      toast.success(`Event ${data.title} created successfully.`)
      reset()
      setLevel(0)
      onClose()
    } catch (error) {
      toast.error('Failed to create event')
      if (error instanceof Error) {
        setError('root', { message: error.message })
      }
    }
  }

  const toDateValue = (date: Date) => parseDate(date.toISOString().split('T')[0])

  return (
    <Modal size="2xl" radius="sm" isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Add Event</ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="h-full px-2 lg:px-6">
            <div className="flex h-full w-full items-center gap-1 lg:gap-5">
              <div className="flex h-full items-center gap-2 lg:gap-4 p-1 lg:p-5">
                <div className="h-[100px] w-[2px] bg-light-200"></div>
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 w-1.5 ${level == index ? 'bg-light-400' : 'bg-light-200'} rounded-full hover:cursor-pointer`}
                      onClick={() => setLevel(index)}
                    ></div>
                  ))}
                </div>
              </div>
              <div className="items-center justify-center">
                {level === 0 && (
                  <div className="flex max-w-72 items-center justify-between gap-10 flex-col lg:flex-row">
                    <div>
                      <Input
                        type="text"
                        variant="underlined"
                        label="Event Name"
                        isClearable
                        {...register('title')}
                        readOnly={isSubmitting}
                        isInvalid={!!errors.title}
                        errorMessage={errors.title?.message}
                        className="mt-4"
                      />
                      <Controller
                        name="category"
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Autocomplete
                            label="Select Category"
                            className="mt-4"
                            variant="underlined"
                            value={value}
                            selectedKey={value ? value.toString() : ''}
                            onSelectionChange={onChange}
                            isInvalid={!!errors.category}
                            errorMessage={errors.category?.message}
                            onBlur={onBlur}
                            inputProps={{
                              classNames: {
                                base: 'bg-white',
                                inputWrapper:
                                  "px-1 bg-white shadow-none border-b-3 border-light-200 rounded-none after:content-[''] after:w-0 after:origin-center after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-[2px] after:h-[2px] data-[open=true]:after:w-full data-[focus=true]:after:w-full after:bg-light-900 after:transition-width motion-reduce:after:transition-none",
                                label: 'text-light-300 dark:text-secondary-400 text-small',
                                input: 'text-secondary-950 dark:text-white',
                              },
                            }}
                          >
                            <AutocompleteItem key="BABYSHOWER" value="Baby Shower">
                              Baby Shower
                            </AutocompleteItem>
                            <AutocompleteItem key="BIRTHDAYPARTY" value="Birthday Party">
                              Birthday Party
                            </AutocompleteItem>
                            <AutocompleteItem key="BAPTISM" value="Baptism">
                              Baptism
                            </AutocompleteItem>
                          </Autocomplete>
                        )}
                      />
                    </div>
                    <Textarea
                      label="Description"
                      placeholder="Enter a description"
                      variant="underlined"
                      className="mt-4 self-end"
                      {...register('description')}
                      isInvalid={!!errors.description}
                      errorMessage={errors.description?.message}
                      readOnly={isSubmitting}
                    />
                  </div>
                )}
                {level === 1 && (
                  <div className="flex gap-5 flex-col lg:flex-row">
                    <div>
                      <Input
                        type="Number"
                        variant="underlined"
                        label="Price"
                        isClearable
                        className="mt-4"
                        {...register('price')}
                        isInvalid={!!errors.price}
                        errorMessage={errors.price?.message}
                        readOnly={isSubmitting}
                      />
                      <Input
                        type="Number"
                        variant="underlined"
                        label="Deposit"
                        isClearable
                        className="mt-4"
                        {...register('deposit')}
                        isInvalid={!!errors.deposit}
                        errorMessage={errors.deposit?.message}
                        readOnly={isSubmitting}
                      />
                    </div>
                    <div>
                      <Controller
                        name="dateRange"
                        control={control}
                        defaultValue={{
                          start: toDateValue(new Date()),
                          end: toDateValue(new Date()),
                        }}
                        rules={{ required: 'Date range is required' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <DateRangePicker
                            label="Event duration"
                            className="mt-4 max-w-xs"
                            variant="underlined"
                            value={value}
                            onChange={(val) => onChange(val)}
                            onBlur={onBlur}
                            isInvalid={!!errors.dateRange}
                            errorMessage={errors.dateRange?.message}
                          />
                        )}
                      />
                      <div className="flex">
                        <Controller
                          name="startTime"
                          control={control}
                          defaultValue={new Time()}
                          rules={{ required: 'Start time is required' }}
                          render={({ field: { onChange, onBlur, value } }) => (
                            <TimeInput
                              label="Start Time"
                              variant="underlined"
                              className="mt-4"
                              value={value}
                              onChange={onChange}
                              onBlur={onBlur}
                              isInvalid={!!errors.startTime}
                              errorMessage={errors.startTime?.message}
                            />
                          )}
                        />
                        <Controller
                          name="endTime"
                          control={control}
                          defaultValue={new Time()}
                          rules={{ required: 'End time is required' }}
                          render={({ field: { onChange, onBlur, value } }) => (
                            <TimeInput
                              label="End Time"
                              variant="underlined"
                              className="mt-4"
                              value={value}
                              onChange={onChange}
                              onBlur={onBlur}
                              isInvalid={!!errors.endTime}
                              errorMessage={errors.endTime?.message}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="mt-8">
            {level === 0 && (
              <>
                <Button
                  color="danger"
                  variant="faded"
                  radius="sm"
                  onPress={() => {
                    setLevel(0)
                    onClose()
                  }}
                >
                  Cancel
                </Button>
                <Button radius="sm" color="success" variant="faded" onPress={() => setLevel(1)}>
                  Next
                </Button>
              </>
            )}
            {level === 1 && (
              <>
                <Button radius="sm" color="danger" variant="faded" onPress={() => setLevel(0)}>
                  Back
                </Button>
                <Button radius="sm" color="success" variant="faded" type="submit">
                  Save
                </Button>
              </>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default Header
