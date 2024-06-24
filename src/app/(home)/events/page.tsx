'use client'
import { Input } from '@nextui-org/input'
import { Search } from 'lucide-react'
import React, { useCallback } from 'react'
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
import { formatDate } from '@/utils/date'

type Event = {
  title: string
  start: string
  end: string
  action?: string
}

enum ColumnKeys {
  EVENT = 'event',
  ACTION = 'action',
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
]

const events = [
  {
    title: 'Music Festival',
    start: '2021-06-12T10:00:00',
    end: '2021-06-13T22:00:00',
    action: 'View',
  },
  {
    title: 'Tech Conference',
    start: '2024-07-24T10:00:00',
    end: '2025-06-13T22:00:00',
    action: 'View',
  },
  {
    title: 'Tech Conference',
    start: '2024-07-25T10:00:00',
    end: '2025-06-13T22:00:00',
    action: 'View',
  },
  {
    title: 'Tech Conference',
    start: '2021-06-12T10:00:00',
    end: '2021-06-13T22:00:00',
    action: 'View',
  },
  {
    title: 'Music Festival',
    start: '2021-06-12T10:00:00',
    end: '2021-06-13T22:00:00',
    action: 'View',
  },
  {
    title: 'Tech Conference',
    start: '2021-06-12T10:00:00',
    end: '2021-06-13T22:00:00',
    action: 'View',
  },
  {
    title: 'Music Festival',
    start: '2024-06-24T17:35:37.432Z',
    end: '2021-06-13T22:00:00',
    action: 'View',
  },
  {
    title: 'Tech Conference',
    start: '2021-06-12T10:00:00',
    end: '2021-06-13T22:00:00',
    action: 'View',
  },
]

const page = () => {
  const [currentChip, setCurrentChip] = React.useState<string>(chips[0])
  const [filteredEvents, setFilteredEvents] = React.useState<Event[]>(events)
  const [searchValue, setSearchValue] = React.useState<string>('')

  const filterEvents = useCallback((events: Event[], chip?: string, searchValue?: string) => {
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
  }, [])

  const handleChipClick = useCallback(
    (chip: string) => {
      setCurrentChip(chip)
      setFilteredEvents(filterEvents(events, chip, searchValue))
    },
    [searchValue, filterEvents, events]
  )

  const renderCell = React.useCallback((event: Event, columnKey: ColumnKeys) => {
    const cellValue = event[columnKey === ColumnKeys.EVENT ? 'title' : columnKey] as string

    switch (columnKey) {
      case ColumnKeys.EVENT:
        return (
          <div>
            <h3 className="text-base font-medium">{event.title}</h3>
            <p className="text-sm text-light-300">
              {formatDate(event.start)} - {formatDate(event.end)}
            </p>
          </div>
        )
      case ColumnKeys.ACTION:
        return (
          <Button radius="sm" size="sm" className="bg-light-100 font-medium">
            {cellValue}
          </Button>
        )
      default:
        return cellValue
    }
  }, [])

  const onSearchClear = () => {
    setSearchValue('')
    setFilteredEvents(filterEvents(events, currentChip))
  }

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    setFilteredEvents(filterEvents(events, currentChip, value))
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
      <div className="flex gap-2 md:px-4">
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
                  <TableCell key={column.key} className='px-0'>{renderCell(event, column.key)}</TableCell>
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
