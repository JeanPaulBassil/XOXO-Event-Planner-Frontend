'use client'
import { FC } from 'react'
import { Calendar, dateFnsLocalizer, Navigate } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import enUS from 'date-fns/locale/en-US'

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './styles.scss'
import { Popover, PopoverContent, PopoverTrigger } from '@nextui-org/popover'
import {
  Avatar,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Link,
  Select,
  SelectItem,
} from '@nextui-org/react'
import { useEvents } from '../contexts/EventContext'
import { Event } from '@/api/models/Event.model'
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {}

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const Page: FC<Props> = (props: Props) => {
  const { events } = useEvents()

  if (!events) {
    return <div>Loading...</div>
  }

  const calendarEvents = events.map((event) => {
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)

    return {
      ...event,
      start: startDate,
      end: endDate,
    }
  })

  return (
    <div className="w-screen overflow-x-scroll px-3 py-3 lg:px-10 lg:py-10 scrollbar-hide">
      <div className="h-[1000px] w-full overflow-y-scroll scrollbar-hide lg:w-full">
        <Calendar
          events={calendarEvents}
          localizer={localizer}
          components={{
            header: ({ label }: { label: string }) => {
              const number = label.split(' ')[0]
              const day = label.split(' ')[1]

              return (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm font-medium text-light-400">{day}</span>
                  <span className="text-2xl font-bold text-light-400">{number}</span>
                </div>
              )
            },
            timeGutterHeader: () => {
              return <div></div>
            },
            event: ({ event }: { event: Event }) => {
              const startDate = new Date(event.startDate)
              const startMonth = startDate.toLocaleString('default', { month: 'long' })
              const startDay = startDate.getDate()
              const startHour = ('0' + startDate.getHours()).slice(-2)
              const startMinutes = ('0' + startDate.getMinutes()).slice(-2)
              const startAmPm = startDate.getHours() >= 12 ? 'pm' : 'am'

              const endDate = new Date(event.endDate)
              const endMonth = endDate.toLocaleString('default', { month: 'long' })
              const endDay = endDate.getDate()
              const endHour = ('0' + endDate.getHours()).slice(-2)
              const endMinutes = ('0' + endDate.getMinutes()).slice(-2)
              const endAmPm = endDate.getHours() >= 12 ? 'pm' : 'am'

              return (
                <Popover showArrow radius="sm" placement="bottom">
                  <PopoverTrigger>
                    <div className="flex h-full items-center justify-center">{event.title}</div>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Card shadow="none" className="bg-transparent max-w-[300px] border-none">
                      <CardHeader className="justify-between gap-5">
                        <div className="flex gap-3">
                          <Avatar
                            isBordered
                            radius="full"
                            size="md"
                            name={`${event.client?.name}`}
                          />
                          <div className="flex flex-col items-start justify-center">
                            <h4 className="text-small font-semibold leading-none text-default-600">
                              {event.client?.name}
                            </h4>
                            <h5 className="text-small tracking-tight text-default-500">
                              {event.client?.phone
                                ? event.client?.phone
                                : event.client?.email
                                  ? event.client?.email
                                  : 'No contact info'}
                            </h5>
                          </div>
                        </div>
                        <Link href={`/events/${event.id}`}>
                          <Button color="danger" radius="sm" size="sm" variant="solid">
                            Event Details
                          </Button>
                        </Link>
                      </CardHeader>
                      <CardBody className="px-3 py-0">
                        <p className="pl-px text-small text-default-500">
                          {event.description.length > 100
                            ? event.description.slice(0, 100) + '...'
                            : event.description
                              ? event.description
                              : 'No description'}
                        </p>
                      </CardBody>
                      <CardFooter className="gap-3">
                        <div className="flex gap-1">
                          <p className="text-small font-semibold text-default-600">
                            {startMonth} {startDay}
                          </p>
                          <p className="text-small text-default-500">
                            {startHour}:{startMinutes}
                            {startAmPm}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <p className="text-small font-semibold text-default-600">
                            {endMonth} {endDay}
                          </p>
                          <p className="text-small text-default-500">
                            {endHour}:{endMinutes}
                            {endAmPm}
                          </p>
                        </div>
                      </CardFooter>
                    </Card>
                  </PopoverContent>
                </Popover>
              )
            },
            toolbar: (toolbarProps) => {
              return (
                <div className="flex items-center justify-between pb-10 w-full">
                  <ButtonGroup>
                    <Button
                      color="danger"
                      radius="sm"
                      size="md"
                      variant="solid"
                      isIconOnly
                      onClick={() => toolbarProps.onNavigate(Navigate.PREVIOUS)}
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      color="danger"
                      radius="sm"
                      size="md"
                      variant="solid"
                      onClick={() => toolbarProps.onNavigate(Navigate.TODAY)}
                      isIconOnly
                    >
                      <CalendarCheck />
                    </Button>
                    <Button
                      color="danger"
                      radius="sm"
                      size="md"
                      variant="solid"
                      isIconOnly
                      onClick={() => toolbarProps.onNavigate(Navigate.NEXT)}
                    >
                      <ChevronRight />
                    </Button>
                  </ButtonGroup>

                  <div className=" items-center gap-3 hidden lg:flex">
                    <h3 className="text-lg font-bold text-light-400">{toolbarProps.label}</h3>
                  </div>

                  <Select
                    className="w-32"
                    color="danger"
                    radius="sm"
                    defaultSelectedKeys={['month']}
                    placeholder="Select View"
                    size="md"
                    onChange={(event) => {
                      const value = event.target.value
                      if (value === 'month') toolbarProps.onView('month')
                      else if (value === 'week') toolbarProps.onView('week')
                      else if (value === 'day') toolbarProps.onView('day')
                      else if (value === 'agenda') toolbarProps.onView('agenda')
                    }}
                  >
                    <SelectItem key="month" value="month">
                      Month
                    </SelectItem>
                    <SelectItem key="week" value="week">
                      Week
                    </SelectItem>
                    <SelectItem key="day" value="day">
                      Day
                    </SelectItem>
                    <SelectItem key="agenda" value="agenda">
                      Agenda
                    </SelectItem>
                  </Select>
                </div>
              )
            },
          }}
          className="h-full scrollbar"
          startAccessor="start"
          endAccessor="end"
        />
      </div>
    </div>
  )
}

export default Page
