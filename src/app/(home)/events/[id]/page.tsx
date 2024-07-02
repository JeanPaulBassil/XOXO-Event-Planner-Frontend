'use client'
import React, { useEffect, useState } from 'react'
import { useEvents } from '../../contexts/EventContext'
import { Event } from '@/api/models/Event.model'
import { toCapitalCase } from '@/utils/string'
import { Skeleton } from '@nextui-org/react'
import { Coins, Edit } from 'lucide-react'
import { zonedFormatDate } from '@/utils/date'

type Props = {
  params: {
    id: string
  }
}

const easeInOut = (t: number) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const Page = ({ params }: Props) => {
  const { getEvent } = useEvents()
  const [event, setEvent] = useState<Event | undefined>(undefined)
  const [price, setPrice] = useState<number>(0)
  const [deposit, setDeposit] = useState<number>(0)
  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    const fetchEvent = async () => {
      const eventData = await getEvent(Number(params.id))
      setEvent(eventData)

      const animateValue = (
        start: number,
        end: number,
        setter: React.Dispatch<React.SetStateAction<number>>
      ) => {
        const duration = 2000 // Duration in milliseconds
        const startTime = performance.now()

        const animate = (currentTime: number) => {
          const elapsedTime = currentTime - startTime
          const t = Math.min(elapsedTime / duration, 1)
          const easedT = easeInOut(t)
          const value = start + (end - start) * easedT

          setter(Math.round(value))

          if (t < 1) {
            requestAnimationFrame(animate)
          }
        }

        requestAnimationFrame(animate)
      }

      if (eventData) {
        animateValue(0, eventData.price, setPrice)
        animateValue(0, eventData.deposit, setDeposit)
        animateValue(0, eventData.price - eventData.deposit, setRemaining)
      }
    }
    fetchEvent()
  }, [params.id, getEvent])

  const category = () => {
    switch (event?.category) {
      case 'BABYSHOWER':
        return 'Baby Shower'
      case 'BIRTHDAYPARTY':
        return 'Birthday Party'
      case 'BAPTISM':
        return 'Baptism'
      default:
        return 'Other'
    }
  }

  return (
    <div className="px-3 py-4 md:px-10">
      <div className="flex items-center justify-between">
        {event ? (
          <h1 className="text-3xl font-bold text-light-400">{toCapitalCase(event.title)}</h1>
        ) : (
          <Skeleton className="w-[150px] rounded-full md:w-[400px]">
            <h1 className="h-7 w-3/5 rounded-full bg-default-100"></h1>
          </Skeleton>
        )}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-md bg-light-100 p-3">
            <p className="hidden font-semibold md:block">Edit</p>
            <Edit size={20} />
          </button>
          <button className="flex items-center gap-2 rounded-md bg-light-100 p-3">
            <p className="hidden font-semibold md:block">Add Payment</p>
            <Coins size={20} />
          </button>
        </div>
      </div>
      <div className="pt-4">
        {event ? (
          <div className="flex items-center gap-2 text-sm text-light-300">
            {zonedFormatDate(event.startDate)}{' '}
            <div className="h-1.5 w-1.5 rounded-full bg-light-300"></div>{' '}
            {zonedFormatDate(event.endDate)}
          </div>
        ) : (
          <Skeleton className="w-3/4 rounded-lg md:w-1/4">
            <div className="h-3 w-full rounded-lg bg-default-200"></div>
          </Skeleton>
        )}
      </div>
      <h1 className="my-10 text-2xl font-bold">Details</h1>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Category</p>
          {event ? (
            <p className="text-md text-light-400">{category()}</p>
          ) : (
            <Skeleton className="w-[100px] rounded-lg">
              <div className="h-3 w-[100px] rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Price</p>
          {event ? (
            <p className="text-md text-light-400">${price}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Deposit</p>
          {event ? (
            <p className="text-md text-light-400">${deposit}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Remaining</p>
          {event ? (
            <p className="text-md text-light-400">${remaining}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
      </div>
      <h1 className="my-5 text-2xl font-bold">Description</h1>
      <div className="text-light-400">
        {event ? (
          <p>{event.description === '' ? 'No Description' : event.description}</p>
        ) : (
          <div className='flex flex-col gap-2'>
            <Skeleton className="w-full rounded-lg">
              <div className="h-3 w-full rounded-lg bg-default-200"></div>
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="h-3 w-full rounded-lg bg-default-200"></div>
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="h-3 w-full rounded-lg bg-default-200"></div>
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="h-3 w-full rounded-lg bg-default-200"></div>
            </Skeleton>
          </div>
        )}
      </div>
      <h1 className="my-5 text-2xl font-bold">Extra Notes</h1>
      <div className="text-light-400">
        {event ? (
          <p>{event.description === '' ? 'No Notes' : event.description}</p>
        ) : (
          <div className='flex flex-col gap-2'>
            <Skeleton className="w-full rounded-lg">
              <div className="h-3 w-full rounded-lg bg-default-200"></div>
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="h-3 w-full rounded-lg bg-default-200"></div>
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="h-3 w-full rounded-lg bg-default-200"></div>
            </Skeleton>
            <Skeleton className="w-full rounded-lg">
              <div className="h-3 w-full rounded-lg bg-default-200"></div>
            </Skeleton>
          </div>
        )}
      </div>
    </div>
  )
}

export default Page
