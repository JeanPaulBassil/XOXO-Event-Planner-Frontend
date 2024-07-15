'use client'
import React, { useEffect, useState } from 'react'
import { useEvents } from '../../contexts/EventContext'
import { Event } from '@/api/models/Event.model'
import { toCapitalCase } from '@/utils/string'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  useDisclosure,
} from '@nextui-org/react'
import { Coins, DoorClosed, Edit, Plus } from 'lucide-react'
import { zonedFormatDate } from '@/utils/date'
import Link from 'next/link'
import { joiResolver } from '@hookform/resolvers/joi'
import { useForm, FieldValues } from 'react-hook-form'
import Joi, { CustomHelpers } from 'joi'
import toast from 'react-hot-toast'

type Props = {
  params: {
    id: string
  }
}

const Page = ({ params }: Props) => {
  const { getEvent, editEvent } = useEvents()
  const [event, setEvent] = useState<Event | undefined>(undefined)
  const [price, setPrice] = useState<number>(0)
  const [deposit, setDeposit] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [remaining, setRemaining] = useState<number>(0)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  useEffect(() => {
    const fetchEvent = async () => {
      const eventData = await getEvent(Number(params.id))
      setEvent(eventData)

      if (eventData) {
        setPrice(eventData.price)
        setDeposit(eventData.deposit)
        setRemaining(eventData.price - eventData.paidAmount)
        setPaidAmount(eventData.paidAmount)
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

  const addPaymentSchema = Joi.object({
    price: Joi.number().required().min(0).max(remaining).messages({
      'number.base': 'Amount due must be a number',
      'number.min': 'Amount due cannot be negative',
      'number.max': `Amount due cannot be greater than the remaining amount (${remaining})`,
      'any.required': 'Amount due is required',
    }),
  })

  const {
    handleSubmit,
    register,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{
    price: number
  }>({
    resolver: joiResolver(addPaymentSchema),
  })

  const onSubmit = handleSubmit(async (data) => {
    const newPaidAmount = (event?.paidAmount || 0) + data.price

    if (event && newPaidAmount > event.price) {
      setError('price', {
        type: 'manual',
        message: 'Total paid amount cannot exceed the total price',
      })
      return
    }

    if (event) {
      await editEvent(Number(params.id), {
        ...event,
        paidAmount: newPaidAmount,
        remaining: event.price - newPaidAmount,
      })

      toast.success('Payment added successfully')
      reset()
      onOpenChange()
    }
  })

  return (
    <div className="px-3 py-4 md:px-10">
      <Modal backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add Payment</ModalHeader>
              <form onSubmit={onSubmit}>
                <ModalBody>
                  <Input
                    type="number"
                    isRequired
                    variant="underlined"
                    label="Amount Due"
                    isClearable
                    className="mt-4 md:max-w-72"
                    {...register('price')}
                    isInvalid={!!errors.price}
                    errorMessage={errors.price?.message}
                    readOnly={isSubmitting}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="danger"
                    radius="sm"
                    variant="light"
                    onPress={onClose}
                    endContent={<DoorClosed size={20} />}
                  >
                    Close
                  </Button>
                  <Button
                    color="success"
                    className="text-light-50"
                    radius="sm"
                    endContent={<Plus size={20} color="white" />}
                    type="submit"
                  >
                    Add
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="flex items-center justify-between">
        {event ? (
          <h1 className="text-3xl font-bold text-light-400">{toCapitalCase(event.title)}</h1>
        ) : (
          <Skeleton className="w-[150px] rounded-full md:w-[400px]">
            <h1 className="h-7 w-3/5 rounded-full bg-default-100"></h1>
          </Skeleton>
        )}
        <div className="flex items-center gap-4">
          <Link href={`/events/${params.id}/edit`}>
            <button className="flex items-center gap-2 rounded-md bg-light-100 p-3">
              <p className="hidden font-semibold lg:block">Edit</p>
              <Edit size={20} />
            </button>
          </Link>
          <button className="flex items-center gap-2 rounded-md bg-light-100 p-3" onClick={onOpen}>
            <p className="hidden font-semibold lg:block">Add Payment</p>
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
          <p className="text-md text-light-300">Amount Due</p>
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
          <p className="text-md text-light-300">Paid Amount</p>
          {event ? (
            <p className="text-md text-light-400">${paidAmount}</p>
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
          <div className="flex flex-col gap-2">
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
          <div className="flex flex-col gap-2">
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
