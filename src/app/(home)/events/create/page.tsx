'use client'
import { EventCategory, EventLocation, EventStatus } from '@/api/models/Event.model'
import { Time, parseDate, CalendarDate } from '@internationalized/date'
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateValue,
  Divider,
  Input,
  NextUIProvider,
  Spacer,
  Textarea,
  TimeInput,
} from '@nextui-org/react'
import Joi from 'joi'
import React from 'react'
import { useEvents } from '../../contexts/EventContext'
import { Controller, useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

interface SectionProps {
  form: React.ReactNode
  title: string
  description: string
}

const Section = (props: SectionProps) => {
  const { title, description, form } = props
  return (
    <div className="mt-10 flex w-full flex-col items-start justify-start p-3 md:p-8 md:py-16 lg:flex-row lg:items-center">
      <div className="flex w-full flex-col md:w-[350px]">
        <h3 className="text-secondary-950 text-base dark:text-secondary-50">{title}</h3>
        <p className="mt-0.5 text-wrap text-small text-light-300 md:w-[90%]">{description}</p>
      </div>
      {form}
    </div>
  )
}

//added type of contact person name
type FormData = {
  clientName: string
  clientBirthday: DateValue
  clientMobile: string
  clientEmail: string
  clientAddress: string
  contactName: string
  school: string
  title: string
  category: EventCategory
  location: EventLocation
  price: number
  extraKidPrice: number
  deposit: number
  description: string
  dateRange: { start: CalendarDate; end: CalendarDate }
  startTime: Time
  endTime: Time
  ageGroup: string
  numberOfAttendees: number
  extraNote: string
}

//added Contact Person name
const createEventSchema = Joi.object({
  clientName: Joi.string().required().messages({
    'any.required': 'Client name is required',
  }),
  clientBirthday: Joi.optional().allow(''),
  clientMobile: Joi.string().optional().allow(''),
  clientEmail: Joi.string()
    .email({
      tlds: { allow: false },
    })
    .optional()
    .allow('')
    .messages({
      'string.email': 'Invalid email format',
    }),
  clientAddress: Joi.string().optional().allow(''),
  contactName: Joi.string().optional().allow(''),
  school: Joi.string().optional().allow(''),
  title: Joi.string().required().messages({
    'any.required': 'Event name is required',
  }),
  category: Joi.string().required().messages({
    'any.required': 'Event category is required',
  }),
  location: Joi.string().required().messages({
    'any.required': 'Event location is required',
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Amount due cannot be negative',
    'any.required': 'Amount due is required',
  }),
  extraKidPrice: Joi.number().min(0).required().messages({
    'number.min': 'Amount due cannot be negative',
    'any.required': 'Amount due is required',
  }),
  deposit: Joi.number().min(0).max(Joi.ref('price')).required().messages({
    'number.min': 'Deposit cannot be negative',
    'number.max': 'Deposit cannot be more than the price',
    'any.required': 'Deposit is required',
  }),
  description: Joi.string().optional().allow(''),
  dateRange: Joi.object({
    start: Joi.required().messages({
      'any.required': 'Event start date is required',
    }),
    end: Joi.required().messages({
      'any.required': 'Event end date is required',
    }),
  }).required(),
  startTime: Joi.required().messages({
    'any.required': 'Start time is required',
  }),
  endTime: Joi.required().messages({
    'any.required': 'End time is required',
  }),
  ageGroup: Joi.string().required().messages({
    'any.required': 'Age group is required',
  }),
  numberOfAttendees: Joi.number().min(0).required().messages({
    'number.min': 'Number of attendees cannot be negative',
    'any.required': 'Number of attendees is required',
  }),
  extraNote: Joi.string().optional().allow(''),
})

export default function CreateEventPage() {
  const { createEvent } = useEvents()
  const router = useRouter()

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

  //added contactPersonName
  const onSubmit = async (data: FormData) => {
    const startDateTime = new Date(
      `${data.dateRange.start.toString()}T${data.startTime.toString()}`
    )
    const endDateTime = new Date(`${data.dateRange.end.toString()}T${data.endTime.toString()}`)

    if (endDateTime < startDateTime) {
      setError('endTime', { message: 'End date and time cannot be before start date and time' })
      toast.error('End date and time cannot be before start date and time')
      return
    }

    const status = EventStatus.Tentative

    try {
      const newEvent = {
        title: data.title,
        category: data.category,
        location: data.location,
        status: status,
        price: data.price,
        extraKidPrice: data.extraKidPrice,
        deposit: data.deposit,
        description: data.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        remaining: data.price + data.extraKidPrice - data.deposit,
        client: {
          name: data.clientName,
          email: data.clientEmail,
          phone: data.clientMobile,
          address: data.clientAddress,
          birthdate: data.clientBirthday ? data.clientBirthday.toString() : null,
          contactname: data.contactName,
          school: data.school,
        },
        ageGroup: data.ageGroup,
        numberOfAttendees: data.numberOfAttendees,
        extraNote: data.extraNote,
      }

      await createEvent(newEvent)
      router.push('/events')
      toast.success(`Event ${data.title} created successfully.`)
      reset()
    } catch (error) {
      toast.error('Failed to create event')
      if (error instanceof Error) {
        setError('root', { message: error.message })
      }
    }
  }

  const toDateValue = (date: Date) => parseDate(date.toISOString().split('T')[0])

  //added input field for contact person name
  return (
    <div className="flex h-full w-full flex-grow flex-col items-start text-light-400">
      <div className="px-3 py-4 md:px-10 md:py-8">
        <h1 className="text-2xl font-bold">Add New Event</h1>
      </div>
      <Spacer y={2} />
      <Divider className="bg-light-200" />
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <Section
          title="Client Information"
          description="Enter the client information"
          form={
            <div className="grid w-full grid-cols-1 gap-10 md:w-auto md:grid-cols-2 xl:grid-cols-3">
              <Input
                type="text"
                variant="underlined"
                label="Name"
                isClearable
                {...register('clientName')}
                readOnly={isSubmitting}
                isInvalid={!!errors.clientName}
                errorMessage={errors.clientName?.message}
                isRequired={true}
                className="mt-4"
              />
              <Controller
                name="clientBirthday"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <NextUIProvider locale='en-GB'>
                  <DatePicker
                    label="Birthday"
                    variant="underlined"
                    className="mt-4"
                    value={value}
                    onChange={(val) => onChange(val)}
                    onBlur={onBlur}
                    isInvalid={!!errors.clientBirthday}
                    errorMessage={errors.clientBirthday?.message}
                    isReadOnly={isSubmitting}
                  />
                  </NextUIProvider>
                  
                )}
              />
              <Textarea
                label="Address"
                variant="underlined"
                className="mt-4"
                {...register('clientAddress')}
                isInvalid={!!errors.clientAddress}
                errorMessage={errors.clientAddress?.message}
                readOnly={isSubmitting}
              />
              <Input
                type="text"
                variant="underlined"
                label="School"
                isClearable
                {...register('school')}
                readOnly={isSubmitting}
                isInvalid={!!errors.school}
                errorMessage={errors.school?.message}
                className="mt-4"
              />
              <Input
                type="email"
                variant="underlined"
                label="Email"
                isClearable
                {...register('clientEmail')}
                readOnly={isSubmitting}
                isInvalid={!!errors.clientEmail}
                errorMessage={errors.clientEmail?.message}
                className="mt-4"
              />
              <Input
                type="text"
                variant="underlined"
                label="Mobile"
                isClearable
                {...register('clientMobile')}
                readOnly={isSubmitting}
                isInvalid={!!errors.clientMobile}
                errorMessage={errors.clientMobile?.message}
                className="mt-4"
              />

              <Input
                type="text"
                variant="underlined"
                label="Contact Name"
                isClearable
                {...register('contactName')}
                readOnly={isSubmitting}
                isInvalid={!!errors.contactName}
                errorMessage={errors.contactName?.message}
                className="mt-4"
              />
            </div>
          }
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section
          title="Event Information"
          description="Enter the event information"
          form={
            <div className="grid w-full grid-cols-1 gap-10 md:w-auto md:grid-cols-2">
              <Input
                type="text"
                variant="underlined"
                label="Event Name"
                isClearable
                {...register('title')}
                readOnly={isSubmitting}
                isInvalid={!!errors.title}
                errorMessage={errors.title?.message}
                isRequired={true}
                className="mt-4 md:max-w-72"
              />
              <Controller
                name="category"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Autocomplete
                    label="Select Category"
                    className="mt-4 md:max-w-72"
                    variant="underlined"
                    isRequired
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
              <Textarea
                label="Description"
                placeholder="Enter a description"
                variant="underlined"
                className="mt-4 self-end md:md:max-w-72"
                {...register('description')}
                isInvalid={!!errors.description}
                errorMessage={errors.description?.message}
                readOnly={isSubmitting}
              />
              <Controller
                name="ageGroup"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Autocomplete
                    isRequired
                    label="Select Age Group"
                    className="mt-4 md:max-w-72"
                    variant="underlined"
                    value={value}
                    selectedKey={value ? value.toString() : ''}
                    onSelectionChange={onChange}
                    isInvalid={!!errors.ageGroup}
                    errorMessage={errors.ageGroup?.message}
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
                    <AutocompleteItem key="0-3" value="0-3">
                      0-3
                    </AutocompleteItem>
                    <AutocompleteItem key="3-6" value="3-6">
                      3-6
                    </AutocompleteItem>
                    <AutocompleteItem key="6-12" value="6-12">
                      6-12
                    </AutocompleteItem>
                    <AutocompleteItem key="12-18" value="12-18">
                      12-18
                    </AutocompleteItem>
                  </Autocomplete>
                )}
              />
              <Input
                type="number"
                isRequired
                variant="underlined"
                label="Number of Attendees"
                isClearable
                className="mt-4 md:max-w-72"
                {...register('numberOfAttendees')}
                isInvalid={!!errors.numberOfAttendees}
                errorMessage={errors.numberOfAttendees?.message}
                readOnly={isSubmitting}
              />
              <Controller
                name="location"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Autocomplete
                    label="Select Location"
                    className="mt-4 md:max-w-72"
                    variant="underlined"
                    isRequired
                    value={value}
                    selectedKey={value ? value.toString() : ''}
                    onSelectionChange={onChange}
                    isInvalid={!!errors.location}
                    errorMessage={errors.location?.message}
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
                    <AutocompleteItem key="INDOOR" value="Indoor">
                      Indoor
                    </AutocompleteItem>
                    <AutocompleteItem key="OUTDOOR" value="Outdoor">
                      Outdoor
                    </AutocompleteItem>
                  </Autocomplete>
                )}
              />
            </div>
          }
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section
          title="Event Duration"
          description="Enter the event duration"
          form={
            <div className="grid w-full grid-cols-1 gap-10 md:max-w-72">
              <Controller
                name="dateRange"
                control={control}
                defaultValue={{
                  start: toDateValue(new Date()),
                  end: toDateValue(new Date()),
                }}
                rules={{ required: 'Date range is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <NextUIProvider locale='en-GB'>
                  <DateRangePicker
                    label="Date Range"
                    variant="underlined"
                    isRequired
                    className="mt-4"
                    value={value}
                    onChange={(val) => onChange(val)}
                    onBlur={onBlur}
                    isInvalid={!!errors.dateRange}
                    errorMessage={errors.dateRange?.message}
                    isReadOnly={isSubmitting}
                  />
                  </NextUIProvider>
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
                      isRequired
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
                      isRequired
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
          }
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section
          title="Payment Information"
          description="Enter the payment information"
          form={
            <div className="grid w-full grid-cols-1 gap-5 md:w-auto md:grid-cols-2">
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
              <Input 
                type='number'
                isRequired
                variant='underlined'
                label='Extra Kid Charge'
                isClearable
                className='mt-4 md:max-w-72'
                {...register('extraKidPrice')}
                isInvalid={!!errors.extraKidPrice}
                errorMessage={errors.extraKidPrice?.message}
                readOnly={isSubmitting}
              />
              <Textarea
                label="Extra Note"
                placeholder="Enter a description"
                variant="underlined"
                className="mt-4 md:max-w-72"
                {...register('extraNote')}
                isInvalid={!!errors.extraNote}
                errorMessage={errors.extraNote?.message}
                readOnly={isSubmitting}
              />
              <Input
                type="number"
                isRequired
                variant="underlined"
                label="Deposit"
                isClearable
                className="mt-4 md:max-w-72"
                {...register('deposit')}
                isInvalid={!!errors.deposit}
                errorMessage={errors.deposit?.message}
                readOnly={isSubmitting}
              />
            </div>
          }
        />
        <div className="flex w-full justify-end gap-5 p-3 md:p-8">
          <Button
            type="button"
            variant="solid"
            color="danger"
            radius="sm"
            onClick={() => router.push('/events')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="solid"
            color="primary"
            radius="sm"
            isLoading={isSubmitting}
            endContent={<Plus size={20} />}
          >
            Create Event
          </Button>
        </div>
      </form>
    </div>
  )
}
