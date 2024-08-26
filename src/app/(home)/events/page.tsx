'use client'
import { Input } from '@nextui-org/input'
import { Search, Hourglass, CheckCircle2 } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { Chip } from '@nextui-org/chip'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/react'
import { zonedFormatDate } from '@/utils/date'
import { useEvents } from '../contexts/EventContext'
import { Event, EventStatus } from '@/api/models/Event.model'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { QueryClient, QueryFilters, useMutation } from '@tanstack/react-query'
import { ServerError } from '@/api/utils'
import { EventsApi } from '@/api/events.api'

type EventInTable = {
  id: number
  title: string
  start: string
  end: string
  status: string
  action?: string
}

enum ColumnKeys {
  EVENT = 'event',
  ACTION = 'action',
  STATUS = 'status',
}

const chips = ['All', 'Upcoming', 'Past', 'Today']

const columns = [
  {
    title: 'Event',
    dataIndex: 'event',
    key: ColumnKeys.EVENT,
  },
  {
    title: 'Action',
    dataIndex: 'action',
    key: ColumnKeys.ACTION,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: ColumnKeys.STATUS,
  }
]

interface UpdateStatusFormData {
  status: EventStatus,
  id: number
}

const page = () => {
  const [currentChip, setCurrentChip] = useState<string>(chips[0])
  const [searchValue, setSearchValue] = useState<string>('')
  const [filteredEvents, setFilteredEvents] = useState<EventInTable[]>([])
  const [eventsInTable, setEventsInTable] = useState<EventInTable[]>([])
  const {getEvent, editEvent, events, isLoading} = useEvents()
  const [localEvents, setLocalEvents] = useState<Event[]>([])
  const router = useRouter()
  const queryClient = new QueryClient()

  const { mutateAsync: editStatusMutation } = useMutation<Event, ServerError, UpdateStatusFormData>({
    mutationFn: async (data) => {
      const eventApi = new EventsApi()
      const response = await eventApi.updateEventStatus(data.id, data.status);
      return response.payload
    },
    onError: async (err) => {
      toast.error(err.message);
    },
    onSuccess: async () => {
      toast.success('Event Status Updated')
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: ['events']
      })

      const previousEvents = queryClient.getQueryData(['events']) as Event[]

      queryClient.setQueriesData(['events'] as QueryFilters, () => {
        previousEvents.map((event) => {
          event.id === data.id ?
          {
            ...event,
            status: data.status
          } : event
        })
      })
    }
  })

  useEffect(() => {
    if (localEvents) {
      const shapedEvents: EventInTable[] = localEvents.map((event) => ({
        id: event.id || 0,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        status: event.status,
        action: 'View',
      }))
      setFilteredEvents(filterEvents(shapedEvents, currentChip, searchValue))
    }
    
  }, [localEvents])

  useEffect(() => {
    if (events) {
      const shapedEvents: EventInTable[] = events.map((event) => ({
        id: event.id || 0,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        status: event.status,
        action: 'View',
      }))
      setFilteredEvents(filterEvents(shapedEvents, currentChip, searchValue))
      setLocalEvents(events)
    }
  }, [events, currentChip, searchValue])

  const filterEvents = useCallback(
    (events: EventInTable[], chip?: string, searchValue?: string) => {
      let filteredEvents = events

      if (searchValue) {
        filteredEvents = filteredEvents.filter((event) =>
          event.title.toLowerCase().includes(searchValue.toLowerCase())
        )
      }

      if (chip === 'Upcoming') {
        filteredEvents = filteredEvents.filter((event) => new Date(event.start) > new Date())
      } else if (chip === 'Past') {
        filteredEvents = filteredEvents.filter((event) => new Date(event.end) < new Date())
      } else if (chip === 'Today') {
        const today = new Date()
        filteredEvents = filteredEvents.filter(
          (event) =>
            new Date(event.start).getDate() === today.getDate() &&
            new Date(event.start).getMonth() === today.getMonth() &&
            new Date(event.start).getFullYear() === today.getFullYear()
        )
      }

      return filteredEvents
    },
    []
  )

  const handleChipClick = useCallback(
    (chip: string) => {
      setCurrentChip(chip)
      if (events) {
        const shapedEvents: EventInTable[] = events.map((event) => ({
          id: event.id || 0,
          title: event.title,
          start: event.startDate,
          end: event.endDate,
          status: event.status,
          action: 'View',
        }))
        setFilteredEvents(filterEvents(shapedEvents, chip, searchValue))
      }
    },
    [searchValue, filterEvents, events]
  )

  const handleConfirmClick = async (event: EventInTable) => {
    await editStatusMutation({
      status: EventStatus.Confirmed,
      id: event.id
    })

    setLocalEvents(prevEvents => prevEvents.map((e) =>
      e.id === event.id ? {...e, status: EventStatus.Confirmed} : e))
  }

  const renderCell = React.useCallback((event: EventInTable, columnKey: ColumnKeys) => {
    const cellValue = event[columnKey === ColumnKeys.EVENT ? 'title' : columnKey] as string

    switch (columnKey) {
      case ColumnKeys.EVENT:
        return (
          <div>
            <h3 className="text-base font-medium">{event.title}</h3>
            <p className="max-w-[90%] text-sm text-light-300">
              {zonedFormatDate(event.start)} - {zonedFormatDate(event.end)}
            </p>
          </div>
        )
      case ColumnKeys.ACTION:
        return (
          <div className='flex items-center gap-2'>
            <Link href={`/events/${event.id}`}>
              <Button radius="sm" size="sm" className="bg-light-100 font-medium">
                {cellValue}
              </Button>
            </Link>
            {event.status === EventStatus.Tentative && (
              <Button radius='sm' size='sm' className='bg-light-100 font-medium' onClick={() => handleConfirmClick(event)}>
              Confirm
            </Button>
            )}
          </div>
          
        )
      case ColumnKeys.STATUS:
        return (
          event.status === EventStatus.Tentative ? (
            <Hourglass className="text-light-600" size={24} strokeWidth={3}/>
          ) : (
            <CheckCircle2 className='text-light-700' size={24} strokeWidth={3} />
          )
        )
      default:
        return cellValue
    }
  }, [])

  const onSearchClear = () => {
    setSearchValue('')
    if (events) {
      const shapedEvents: EventInTable[] = events.map((event) => ({
        id: event.id || 0,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        status: event.status,
        action: 'View',
      }))
      setFilteredEvents(filterEvents(shapedEvents, currentChip))
    }
  }

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    if (events) {
      const shapedEvents: EventInTable[] = events.map((event) => ({
        id: event.id || 0,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        status: event.status,
        action: 'View',
      }))
      setFilteredEvents(filterEvents(shapedEvents, currentChip, value))
    }
  }

  if (isLoading) {
    return <div>loading...</div>
  }

  return (
    <div className="md:px-8">
      <div className="flex w-full items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold text-light-400">Events</h1>
      </div>
      <div className="w-full px-4 py-3 md:px-4">
        <Input
          type="text"
          placeholder={'Search by Name'}
          size="md"
          radius="sm"
          variant="bordered"
          className="max-w-lg"
          classNames={{
            base: ['bg-transparent', 'shadow-none'],
            inputWrapper: [
              'bg-light-100',
              'shadow-none',
              'border-[0px] group-data-[focus=true]:border-[0px]',
              'bg-light-100',
              'border-secondary-200 dark:border-secondary-700',
              'text-secondary-600 dark:text-secondary-50',
              'placeholder:text-secondary-400 dark:placeholder:text-secondary-400',
              'transition-colors duration-200 ease-in-out',
            ],
            input: ['bg-light-100'],
            clearButton: ['text-secondary-300'],
          }}
          isClearable
          value={searchValue}
          onClear={onSearchClear}
          onValueChange={onSearchChange}
          startContent={<Search className="text-secondary-400" size={18} strokeWidth={1} />}
        />
      </div>
      <div className="flex gap-2 px-4">
        {chips.map((chip, index) => (
          <Chip
            radius="sm"
            size="md"
            className={`duration-200 bg-light-100 transition-colors ease-in-out hover:cursor-pointer hover:bg-light-200 ${
              currentChip === chip ? 'bg-light-200' : 'bg-light-100'
            } `}
            key={index}
            classNames={{
              content: 'font-medium',
            }}
            onClick={() => handleChipClick(chip)}
          >
            {chip}
          </Chip>
        ))}
      </div>
      <div className="w-full px-4 py-4 md:px-4">
        <Table
          selectionMode="single"
          hideHeader
          removeWrapper
          aria-label="Example static collection table"
        >
          <TableHeader>
            {columns.map((column) => (
              <TableColumn key={column.key}>{column.title}</TableColumn>
            ))}
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="flex h-96 w-full items-center justify-center">
                <span className="text-light-400">No events found</span>
              </div>
            }
          >
            {filteredEvents.map((event, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.key} className="px-0">
                    {renderCell(event, column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default page
