'use client'
import { FC, useState } from 'react'
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar'
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay, addHours, startOfHour } from 'date-fns'
import enUS from 'date-fns/locale/en-US'

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './styles.scss'
import { Popover, PopoverContent, PopoverTrigger } from '@nextui-org/popover'
import { Avatar, Button, Card, CardBody, CardFooter, CardHeader } from '@nextui-org/react'

type Props = {}

const locales = {
  'en-US': enUS,
}
const endOfHour = (date: Date): Date => addHours(startOfHour(date), 1)
const now = new Date()
const start = endOfHour(now)
const end = addHours(start, 2)
// The types here are `object`. Strongly consider making them better as removing `locales` caused a fatal error
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})
//@ts-ignore
const DnDCalendar = Calendar

const Page: FC<Props> = (props: Props) => {
  const [events, setEvents] = useState<Event[]>([
    {
      title: 'Learn cool stuff',
      start,
      end,
    },
  ])

  const onEventResize: withDragAndDropProps['onEventResize'] = (data) => {
    const { start, end } = data

    setEvents((currentEvents) => {
      const firstEvent = {
        start: new Date(start),
        end: new Date(end),
      }
      return [...currentEvents, firstEvent]
    })
  }

  const onEventDrop: withDragAndDropProps['onEventDrop'] = (data) => {
    console.log(data)
  }

  return (
    <div className="overflow-x-scroll px-10 py-10">
      <div className="w-[1000px] lg:w-full">
        {' '}
        {/* Set a minimum width as needed */}
        <DnDCalendar
          defaultView="week"
          events={events}
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
                            src="https://i.pravatar.cc/150?u=a04258114e29026702d"
                          />
                          <div className="flex flex-col items-start justify-center">
                            <h4 className="text-small font-semibold leading-none text-default-600">
                              Zoey Lang
                            </h4>
                            <h5 className="text-small tracking-tight text-default-500">
                              70 766 858
                            </h5>
                          </div>
                        </div>
                        <Button color="danger" radius="sm" size="sm" variant="solid">
                          Event Details
                        </Button>
                      </CardHeader>
                      <CardBody className="px-3 py-0">
                        <p className="pl-px text-small text-default-500">
                          description of the event that is too long to fit in the card so i put the
                          three dots...
                        </p>
                      </CardBody>
                      <CardFooter className="gap-3">
                        <div className="flex gap-1">
                          <p className="text-small font-semibold text-default-600">June 24</p>
                          <p className="text-small text-default-500">6:00pm</p>
                        </div>
                        <div className="flex gap-1">
                          <p className="text-small font-semibold text-default-600">June 25</p>
                          <p className="text-small text-default-500">4:00am</p>
                        </div>
                      </CardFooter>
                    </Card>
                  </PopoverContent>
                </Popover>
              )
            },
          }}
        />
      </div>
    </div>
  )
}

export default Page
