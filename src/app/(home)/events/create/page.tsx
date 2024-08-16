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
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  NextUIProvider,
  Pagination,
  Spacer,
  Spinner,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  TimeInput,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  useDisclosure,
  ModalContent,
  ModalFooter
} from '@nextui-org/react'
import Joi, { number } from 'joi'
import React, { useEffect } from 'react'
import { useEvents } from '../../contexts/EventContext'
import { Controller, useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, Plus, PlusIcon, Search, Text, Edit, Trash2 } from 'lucide-react'
import { ActivitiesApi } from '@/api/activity.api'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, ServerError } from '@/api/utils'
import { PressEvent, Selection, SortDescriptor } from '@react-types/shared'
import { toCapitalCase } from '@/utils/string'

const INITIAL_VISIBLE_COLUMNS = [
  'name',
  'description',
  'price',
  'action',
]

const INITIAL_ORDERS_VISIBLE_COLUMNS = [
  'description',
  'unit',
  'unitPrice',
  'quantity',
  'total',
  'action'
]

const INITIAL_CAKES_VISIBLE_COLUMNS = [
  'type',
  'description',
  'price',
  'action',
]

const INITIAL_EXTRAS_VISIBLE_COLUMNS = [
  'description',
  'unitPrice',
  'quantity',
  'total',
  'action'
]

const columns = [
  { name: 'Name', uid: 'name', sortable: true},
  { name: 'Description', uid: 'description', sortable: true},
  { name: 'Price', uid: 'price', sortable: true},
  { name: 'Actions', uid: 'action', sortable: false},
]

const orderColumns = [
  { name: 'Description', uid: 'description', sortable: true},
  { name: 'Unit', uid: 'unit', sortable: true},
  { name: 'Unit Price', uid: 'unitPrice', sortable: true},
  { name: 'Quantity', uid: 'quantity', sortable: true},
  { name: 'Total', uid: 'total', sortable: true},
  { name: 'Actions', uid: 'action', sortable: false},
]

const cakeColumns = [
  { name: 'Type', uid: 'type', sortable: true},
  { name: 'Description', uid: 'description', sortable: true},
  { name: 'Price', uid: 'price', sortable: true},
  { name: 'Actions', uid: 'action', sortable: false},
]

const extraColumns = [
  { name: 'Description', uid: 'description', sortable: true},
  { name: 'Unit Price', uid: 'unitPrice', sortable: true},
  { name: 'Quantity', uid: 'quantity', sortable: true},
  { name: 'Total', uid: 'total', sortable: true},
  { name: 'Actions', uid: 'action', sortable: false},
]

interface SectionProps {
  form: React.ReactNode
  title: string
  description: string
}

type ActivityInTable = {
  name: string
  description: string
  price: number
  action?: any[]
}

type OrderInTable = {
  description: string
  unit: string
  unitPrice: number
  quantity: number
  total?: number
  action?: any[]
}

type CakeInTable = {
  type: string
  description: string
  price: number
  action?: any[]
}

type ExtraInTable = {
  description: string
  unitPrice: number
  quantity: number
  total?: number
  action?: any[]
}

type activityProps = {
  add: Function
}

type orderProps = {
  add: Function
}

type cakeProps = {
  add: Function
}

type extraProps = {
  add: Function
}

type editActivityProps = {
  edit: Function
  activity: ActivityInTable
}

type editOrderProps = {
  edit: Function
  order: OrderInTable
}

type editCakeProps = {
  edit: Function
  cake: CakeInTable
}

type editExtraProps = {
  edit: Function
  extra: ExtraInTable
}

type activityTableProps = {
  update: Function
}

type orderTableProps = {
  update: Function
}

type cakeTableProps = {
  update: Function
}

type extraTableProps = {
  update: Function
}

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
  minimumCharge: number
  deposit: number
  description: string
  dateRange: { start: CalendarDate; end: CalendarDate }
  startTime: Time
  endTime: Time
  ageGroup: string
  numberOfAttendees: number
  extraNote: string
}

const activitySchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Activity name is required',
  }),
  description: Joi.string().optional().allow(''),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Activity price cannot be negative',
    'any.required': 'Activity price is required',
  })
})

const orderSchema = Joi.object({
  description: Joi.string().optional().allow(''),
  unit: Joi.string().required().messages({
    'any.required': 'Order name is required',
  }),
  unitPrice: Joi.number().min(0).required().messages({
    'number.min': 'Order price cannot be negative',
    'any.required': 'Order price is required',
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Order quantity cannot be less than one',
    'any.required': 'Order price is required',
  })
})

const cakeSchema = Joi.object({
  type: Joi.string().required().messages({
    'any.required': 'Cake type is required',
  }),
  description: Joi.string().optional().allow(''),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Cake price cannot be negative',
    'any.required': 'Cake price is required',
  })
})

const extraSchema = Joi.object({
  description: Joi.string().required().messages({
    'any.required': 'Extra description is required',
  }),
  unitPrice: Joi.number().min(0).required().messages({
    'number.min': 'Extra price cannot be negative',
    'any.required': 'Extra price is required',
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Extra quantity cannot be less than one',
    'any.required': 'Extra price is required',
  })
})


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
  minimumCharge: Joi.number().min(0).required().messages({
    'number.min': 'Amount due cannot be negative',
    'any.required': 'Amount due is required',
  }),
  deposit: Joi.number().min(0).required().custom((value, helpers) => {
    const { price, extraKidPrice } = helpers.state.ancestors[0];
    const maxDeposit = price + extraKidPrice;
    if (value > maxDeposit) {
      return helpers.error('number.max', { max: maxDeposit });
    }
    return value;
  }).messages({
    'number.min': 'Deposit cannot be negative',
    'number.max': 'Deposit cannot be more than the total amount due (price + extraKidPrice)',
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

const EditFormPopUp = (props: editActivityProps) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ActivityInTable>({
    resolver: joiResolver(activitySchema),
  })

  useEffect(() => {
    const fetchActivity = () => {
      setValue('name', props.activity.name);
      setValue('description', props.activity.description);
      setValue('price', props.activity.price);
    }

    fetchActivity();
  }, [setValue])

  const onSubmit = (data: ActivityInTable, onClose: () => void) => {
    try {
      const updatedActivity = {
        name: data.name,
        description: data.description,
        price: data.price,
        action: [<Edit size={16}/>, <Trash2 size={16}/>]
      }

      props.edit(props.activity.name, updatedActivity);
      onClose();
    } catch (error) {
      toast.error('Failed to update activity')
      if (error instanceof Error) {
        setError('root', { message: error.message })
      }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, onClose: () => void) => {
    e.preventDefault();
    handleSubmit((data) => onSubmit(data, onClose))();
  }

  return (
    <>
      <Button
        isIconOnly
        size='sm'
        onPress={onOpen}
      >
        {props.activity.action && props.activity.action[0]}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Edit Activity
              </ModalHeader>
              <form className="w-full">
              <ModalBody>
              
              <Input
                  type="text"
                  variant="underlined"
                  label="Name"
                  isClearable
                  {...register('name')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                  isRequired={true}
                  className="mt-4"
                />
                <Input
                  type="text"
                  variant="underlined"
                  label="Description"
                  isClearable
                  {...register('description')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                  className="mt-4"
                />
                <Input
                type="number"
                isRequired
                variant="underlined"
                label="Price"
                isClearable
                className="mt-4"
                {...register('price')}
                isInvalid={!!errors.price}
                errorMessage={errors.price?.message}
                readOnly={isSubmitting}
              />
              </ModalBody> 
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onClick={(e) => {
                handleClick(e, onClose)
                }}>
                  Update Activity
                </Button>
              
                
              </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>  
    </>
  )
}

const EditOrderFormPopUp = (props: editOrderProps) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderInTable>({
    resolver: joiResolver(orderSchema),
  })

  useEffect(() => {
    const fetchOrder = () => {
      setValue('description', props.order.description);
      setValue('unit', props.order.unit);
      setValue('unitPrice', props.order.unitPrice);
      setValue('quantity', props.order.quantity);
    }

    fetchOrder();
  }, [setValue])

  const onSubmit = (data: OrderInTable, onClose: () => void) => {
    try {
      const updatedOrder = {
        unit: data.unit,
        description: data.description,
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        action: [<Edit size={16}/>, <Trash2 size={16}/>]
      }

      props.edit(props.order.unit, updatedOrder);
      onClose();
    } catch (error) {
      toast.error('Failed to update order')
      if (error instanceof Error) {
        setError('root', { message: error.message })
      }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, onClose: () => void) => {
    e.preventDefault();
    handleSubmit((data) => onSubmit(data, onClose))();
  }

  return (
    <>
      <Button
        isIconOnly
        size='sm'
        onPress={onOpen}
      >
        {props.order.action && props.order.action[0]}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Edit Order
              </ModalHeader>
              <form className="w-full">
              <ModalBody>
              
              <Input
                  type="text"
                  variant="underlined"
                  label="Unit"
                  isClearable
                  {...register('unit')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.unit}
                  errorMessage={errors.unit?.message}
                  isRequired={true}
                  className="mt-4"
                />
                <Input
                  type="text"
                  variant="underlined"
                  label="Description"
                  isClearable
                  {...register('description')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                  className="mt-4"
                />
                <Input
                type="number"
                isRequired
                variant="underlined"
                label="Price"
                isClearable
                className="mt-4"
                {...register('unitPrice')}
                isInvalid={!!errors.unitPrice}
                errorMessage={errors.unitPrice?.message}
                readOnly={isSubmitting}
              />
              <Input
                type="number"
                isRequired
                variant="underlined"
                label="Quantity"
                isClearable
                className="mt-4"
                {...register('quantity')}
                isInvalid={!!errors.quantity}
                errorMessage={errors.quantity?.message}
                readOnly={isSubmitting}
              />
              </ModalBody> 
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onClick={(e) => {
                handleClick(e, onClose)
                }}>
                  Update Order
                </Button>
              
                
              </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>  
    </>
  )
}

const EditCakeFormPopUp = (props: editCakeProps) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CakeInTable>({
    resolver: joiResolver(cakeSchema),
  })

  useEffect(() => {
    const fetchCake = () => {
      setValue('type', props.cake.type);
      setValue('description', props.cake.description);
      setValue('price', props.cake.price);
    }

    fetchCake();
  }, [setValue])

  const onSubmit = (data: CakeInTable, onClose: () => void) => {
    try {
      const updatedCake = {
        type: data.type,
        description: data.description,
        price: data.price,
        action: [<Edit size={16}/>, <Trash2 size={16}/>]
      }

      props.edit(props.cake.type, updatedCake);
      onClose();
    } catch (error) {
      toast.error('Failed to update cake')
      if (error instanceof Error) {
        setError('root', { message: error.message })
      }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, onClose: () => void) => {
    e.preventDefault();
    handleSubmit((data) => onSubmit(data, onClose))();
  }

  return (
    <>
      <Button
        isIconOnly
        size='sm'
        onPress={onOpen}
      >
        {props.cake.action && props.cake.action[0]}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Edit Cake
              </ModalHeader>
              <form className="w-full">
              <ModalBody>
              
              <Input
                  type="text"
                  variant="underlined"
                  label="Name"
                  isClearable
                  {...register('type')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.type}
                  errorMessage={errors.type?.message}
                  isRequired={true}
                  className="mt-4"
                />
                <Input
                  type="text"
                  variant="underlined"
                  label="Description"
                  isClearable
                  {...register('description')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                  className="mt-4"
                />
                <Input
                type="number"
                isRequired
                variant="underlined"
                label="Price"
                isClearable
                className="mt-4"
                {...register('price')}
                isInvalid={!!errors.price}
                errorMessage={errors.price?.message}
                readOnly={isSubmitting}
              />
              </ModalBody> 
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onClick={(e) => {
                handleClick(e, onClose)
                }}>
                  Update Cake
                </Button>
              
                
              </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>  
    </>
  )
}

const EditExtraFormPopUp = (props: editExtraProps) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExtraInTable>({
    resolver: joiResolver(extraSchema),
  })

  useEffect(() => {
    const fetchExtra = () => {
      setValue('description', props.extra.description);
      setValue('unitPrice', props.extra.unitPrice);
      setValue('quantity', props.extra.quantity);
    }

    fetchExtra();
  }, [setValue])

  const onSubmit = (data: ExtraInTable, onClose: () => void) => {
    try {
      const updatedExtra = {
        description: data.description,
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        action: [<Edit size={16}/>, <Trash2 size={16}/>]
      }

      props.edit(props.extra.description, updatedExtra);
      onClose();
    } catch (error) {
      toast.error('Failed to update extra')
      if (error instanceof Error) {
        setError('root', { message: error.message })
      }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, onClose: () => void) => {
    e.preventDefault();
    handleSubmit((data) => onSubmit(data, onClose))();
  }

  return (
    <>
      <Button
        isIconOnly
        size='sm'
        onPress={onOpen}
      >
        {props.extra.action && props.extra.action[0]}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Edit Extra
              </ModalHeader>
              <form className="w-full">
              <ModalBody>
                <Input
                  type="text"
                  variant="underlined"
                  label="Description"
                  isClearable
                  {...register('description')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                  isRequired
                  className="mt-4"
                />
                <Input
                type="number"
                isRequired
                variant="underlined"
                label="Price"
                isClearable
                className="mt-4"
                {...register('unitPrice')}
                isInvalid={!!errors.unitPrice}
                errorMessage={errors.unitPrice?.message}
                readOnly={isSubmitting}
              />
              <Input
                type="number"
                isRequired
                variant="underlined"
                label="Quantity"
                isClearable
                className="mt-4"
                {...register('quantity')}
                isInvalid={!!errors.quantity}
                errorMessage={errors.quantity?.message}
                readOnly={isSubmitting}
              />
              </ModalBody> 
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onClick={(e) => {
                handleClick(e, onClose)
                }}>
                  Update Extra
                </Button>
              
                
              </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>  
    </>
  )
}

const FormPopUp = (props: activityProps) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ActivityInTable>({
    resolver: joiResolver(activitySchema),
  })

  const onSubmit = (data: ActivityInTable, onClose: () => void) => {
    try {
      const newActivity = {
        name: data.name,
        description: data.description,
        price: data.price,
        action: [<Edit size={16}/>, <Trash2 size={16}/>]
      }

      props.add(newActivity);
      reset();
      onClose()
    } catch (error) {
        toast.error('Failed to create activity')
        if (error instanceof Error) {
          setError('root', { message: error.message })
        }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, onClose: () => void) => {
    e.preventDefault();
    handleSubmit((data) => onSubmit(data, onClose))();
  }

  return (
    <>
      <Button
        color="danger"
        radius="sm"
        size="md"
        variant="solid"
        className="text-lg font-medium lg:flex"
        isIconOnly
        onPress={onOpen}
      >
        <PlusIcon />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Create Activity
              </ModalHeader>
              <form className="w-full">
              <ModalBody>
              
              <Input
                  type="text"
                  variant="underlined"
                  label="Name"
                  isClearable
                  {...register('name')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                  isRequired={true}
                  className="mt-4"
                />
                <Input
                  type="text"
                  variant="underlined"
                  label="Description"
                  isClearable
                  {...register('description')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                  className="mt-4"
                />
                <Input
                type="number"
                isRequired
                variant="underlined"
                label="Price"
                isClearable
                className="mt-4"
                {...register('price')}
                isInvalid={!!errors.price}
                errorMessage={errors.price?.message}
                readOnly={isSubmitting}
              />
              
              
              </ModalBody> 
              <ModalFooter>
              
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onClick={(e) => {
                handleClick(e, onClose)
                }}>
                  Create Activity
                </Button>
              </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>  
    </>
  )
}

const OrderFormPopUp = (props: orderProps) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrderInTable>({
    resolver: joiResolver(orderSchema),
  })

  const onSubmit = (data: OrderInTable, onClose: () => void) => {
    try {
      const newOrder = {
        unit: data.unit,
        description: data.description,
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        total: (data.unitPrice * data.quantity),
        action: [<Edit size={16}/>, <Trash2 size={16}/>]
      }

      props.add(newOrder);
      reset();
      onClose()
    } catch (error) {
        toast.error('Failed to create Order')
        if (error instanceof Error) {
          setError('root', { message: error.message })
        }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, onClose: () => void) => {
    e.preventDefault();
    handleSubmit((data) => onSubmit(data, onClose))();
  }

  return (
    <>
      <Button
        color="danger"
        radius="sm"
        size="md"
        variant="solid"
        className="text-lg font-medium lg:flex"
        isIconOnly
        onPress={onOpen}
      >
        <PlusIcon />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Create Order
              </ModalHeader>
              <form className="w-full">
              <ModalBody>
              
              <Input
                  type="text"
                  variant="underlined"
                  label="Unit"
                  isClearable
                  {...register('unit')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.unit}
                  errorMessage={errors.unit?.message}
                  isRequired={true}
                  className="mt-4"
                />
                <Input
                  type="text"
                  variant="underlined"
                  label="Description"
                  isClearable
                  {...register('description')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                  className="mt-4"
                />
                <Input
                type="number"
                isRequired
                variant="underlined"
                label="Price"
                isClearable
                className="mt-4"
                {...register('unitPrice')}
                isInvalid={!!errors.unitPrice}
                errorMessage={errors.unitPrice?.message}
                readOnly={isSubmitting}
              />
              <Input
                type="number"
                isRequired
                variant="underlined"
                label="Quantity"
                isClearable
                className="mt-4"
                {...register('quantity')}
                isInvalid={!!errors.quantity}
                errorMessage={errors.quantity?.message}
                readOnly={isSubmitting}
              />
              
              </ModalBody> 
              <ModalFooter>
              
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onClick={(e) => {
                handleClick(e, onClose)
                }}>
                  Create Order
                </Button>
              </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>  
    </>
  )
}

const CakeFormPopUp = (props: cakeProps) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CakeInTable>({
    resolver: joiResolver(cakeSchema),
  })

  const onSubmit = (data: CakeInTable, onClose: () => void) => {
    try {
      const newCake = {
        type: data.type,
        description: data.description,
        price: data.price,
        action: [<Edit size={16}/>, <Trash2 size={16}/>]
      }

      props.add(newCake);
      reset();
      onClose()
    } catch (error) {
        toast.error('Failed to create cake')
        if (error instanceof Error) {
          setError('root', { message: error.message })
        }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, onClose: () => void) => {
    e.preventDefault();
    handleSubmit((data) => onSubmit(data, onClose))();
  }

  return (
    <>
      <Button
        color="danger"
        radius="sm"
        size="md"
        variant="solid"
        className="text-lg font-medium lg:flex"
        isIconOnly
        onPress={onOpen}
      >
        <PlusIcon />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Create Cake
              </ModalHeader>
              <form className="w-full">
              <ModalBody>
              
              <Input
                  type="text"
                  variant="underlined"
                  label="Type"
                  isClearable
                  {...register('type')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.type}
                  errorMessage={errors.type?.message}
                  isRequired={true}
                  className="mt-4"
                />
                <Input
                  type="text"
                  variant="underlined"
                  label="Description"
                  isClearable
                  {...register('description')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                  className="mt-4"
                />
                <Input
                type="number"
                isRequired
                variant="underlined"
                label="Price"
                isClearable
                className="mt-4"
                {...register('price')}
                isInvalid={!!errors.price}
                errorMessage={errors.price?.message}
                readOnly={isSubmitting}
              />
              
              
              </ModalBody> 
              <ModalFooter>
              
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onClick={(e) => {
                handleClick(e, onClose)
                }}>
                  Create Cake
                </Button>
              </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>  
    </>
  )
}

const ExtraFormPopUp = (props: extraProps) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExtraInTable>({
    resolver: joiResolver(extraSchema),
  })

  const onSubmit = (data: ExtraInTable, onClose: () => void) => {
    try {
      const newExtra = {
        description: data.description,
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        total: (data.unitPrice * data.quantity),
        action: [<Edit size={16}/>, <Trash2 size={16}/>]
      }

      props.add(newExtra);
      reset();
      onClose()
    } catch (error) {
        toast.error('Failed to create Extra')
        if (error instanceof Error) {
          setError('root', { message: error.message })
        }
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, onClose: () => void) => {
    e.preventDefault();
    handleSubmit((data) => onSubmit(data, onClose))();
  }

  return (
    <>
      <Button
        color="danger"
        radius="sm"
        size="md"
        variant="solid"
        className="text-lg font-medium lg:flex"
        isIconOnly
        onPress={onOpen}
      >
        <PlusIcon />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Create Extra
              </ModalHeader>
              <form className="w-full">
              <ModalBody>
                <Input
                  type="text"
                  variant="underlined"
                  label="Description"
                  isClearable
                  {...register('description')}
                  readOnly={isSubmitting}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description?.message}
                  isRequired
                  className="mt-4"
                />
                <Input
                type="number"
                isRequired
                variant="underlined"
                label="Price"
                isClearable
                className="mt-4"
                {...register('unitPrice')}
                isInvalid={!!errors.unitPrice}
                errorMessage={errors.unitPrice?.message}
                readOnly={isSubmitting}
              />
              <Input
                type="number"
                isRequired
                variant="underlined"
                label="Quantity"
                isClearable
                className="mt-4"
                {...register('quantity')}
                isInvalid={!!errors.quantity}
                errorMessage={errors.quantity?.message}
                readOnly={isSubmitting}
              />
              
              </ModalBody> 
              <ModalFooter>
              
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onClick={(e) => {
                handleClick(e, onClose)
                }}>
                  Create Extra
                </Button>
              </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>  
    </>
  )
}

const ActivityTable = (props: activityTableProps) => {
  // const activitiesApi = new ActivitiesApi()

  // const { data: activities, isLoading } = useQuery<ApiResponse<Activity[]>, ServerError>({
  //   queryKey: ['activities'],
  //   queryFn: async () => await activitiesApi.getActivities(),
  // })

  const [filterValue, setFilterValue] = React.useState('')
  const[visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(2)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [activitiesInTable, setActivitiesInTable] = React.useState<ActivityInTable[]>([])

  const hasSearchFilter = Boolean(filterValue)

  const addActivity =  (activity: ActivityInTable) => {
    setActivitiesInTable([...activitiesInTable, activity])
  }

  // Function to delete an activity by name
  const deleteActivity = (activityName: string) => {
    setActivitiesInTable(prevActivities =>
      prevActivities.filter(activity => activity.name !== activityName)
    );
  };

// Function to edit an activity by name
const editActivity = (activityName: string, updatedActivity: Partial<ActivityInTable>) => {
  setActivitiesInTable(prevActivities => {
    const index = prevActivities.findIndex(activity => activity.name === activityName);
    if (index !== -1) {
      const updatedActivities = [...prevActivities];
      updatedActivities[index] = { ...updatedActivities[index], ...updatedActivity };
      return updatedActivities;
    }
    console.log(`Activity with name "${activityName}" not found.`);
    return prevActivities;
  });
};

  useEffect(() => {
    props.update(activitiesInTable)
    const updateVisibleColumns = () => {
      if (window.innerWidth <= 1024) {
        setVisibleColumns(new Set(['name', 'price']))
      } else {
        setVisibleColumns(new Set(columns.map((c) => c.uid)))
      }
    }

    updateVisibleColumns()
    window.addEventListener('resize', updateVisibleColumns)
    return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [activitiesInTable])

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return columns
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = React.useMemo(() => {
    let filteredActivities = [...(activitiesInTable || [])]

    if (hasSearchFilter) {
      filteredActivities = filteredActivities.filter((activity) =>
        activity.name.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredActivities
  }, [activitiesInTable, filterValue])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof ActivityInTable]
      const second = b[sortDescriptor.column as keyof ActivityInTable]
      const cmp = first !== null && first !== undefined && second !== null && second !== undefined
        ? first < second
          ? -1
          : first > second
            ? 1
            : 0
        : 0
      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1)
    }
  }, [page, pages])

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page])

  // const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setRowsPerPage(Number(e.target.value))
  //   setPage(1)
  // }, [])

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value)
      setPage(1)
    } else {
      setFilterValue('')
    }
  }, [])

  const onClear = React.useCallback(() => {
    setFilterValue('')
    setPage(1)
  }, [])

  const renderCell = React.useCallback((activity: ActivityInTable, columnKey: React.Key) => {
    const cellValue = activity[columnKey as keyof ActivityInTable]
    switch (columnKey) {
      case 'name':
        return (
          <div>
            <p className="text-bold">{activity.name}</p>
          </div>
        )
      case 'price':
        return (
          <div>
            ${activity.price}
          </div>
        )
      case 'action':
        if (Array.isArray(cellValue)) {
          return (
              <div className='flex gap-4'>
                  <EditFormPopUp edit={editActivity} activity={activity}/>
                  <Button onClick={() => deleteActivity(activity.name)} isIconOnly size='sm'>{cellValue[1]}</Button>
              </div>
          );
      } else {
          console.error("Expected 'action' to be an array, but got:", cellValue);
          return null;
      }
      default:
        return cellValue
    }
  }, [])

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            type="text"
            placeholder={'Search by Name'}
            size="md"
            radius="sm"
            variant="bordered"
            className="max-w-sm"
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
            value={filterValue}
            onClear={onClear}
            onValueChange={onSearchChange}
            startContent={<Search className="text-secondary-400" size={18} strokeWidth={1} />}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  radius="sm"
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {toCapitalCase(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
              <FormPopUp add={addActivity}/>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">
            Total {activitiesInTable?.length} activities
          </span>
          {/* <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent rounded-md text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="5">2</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label> */}
        </div>
      </div>
    )
  }, [
    filterValue,
    visibleColumns,
    // onRowsPerPageChange,
    activitiesInTable?.length,
    onSearchChange,
    hasSearchFilter
  ])

  const bottomContent = React.useMemo(() => {
    return (
      <div className="z-0 flex items-center justify-between px-2 py-2">
        <Pagination
          isCompact
          showControls
          showShadow
          color="danger"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    )
  }, [items.length, page, pages, hasSearchFilter])

  // if (isLoading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Spinner />
  //     </div>
  //   )
  // }

  return (
    <div>
      <div className="z-0 w-full px-4 py-4 md:px-4">
        <Table
          className="z-0"
          aria-label="Example table with custom cells, pagination and sorting"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] px-0 shadow-none py-0 rounded-none',
          }}
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === 'actions' ? 'center' : 'start'}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={'No activities found'} items={sortedItems}>
            {(item) => (
              <TableRow key={item.name}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const OrderTable = (props: orderTableProps) => {
  const [filterValue, setFilterValue] = React.useState('')
  const[visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_ORDERS_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(2)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'unit',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [ordersInTable, setOrdersInTable] = React.useState<OrderInTable[]>([])

  const hasSearchFilter = Boolean(filterValue)

  const addOrder =  (order: OrderInTable) => {
    setOrdersInTable([...ordersInTable, order])
  }

  // Function to delete an activity by name
  const deleteOrder = (orderName: string) => {
    setOrdersInTable(prevOrders =>
      prevOrders.filter(order => order.unit !== orderName)
    );
  };

// Function to edit an activity by name
const editOrder = (orderName: string, updatedOrder: Partial<OrderInTable>) => {
  setOrdersInTable(prevOrders => {
    const index = prevOrders.findIndex(order => order.unit === orderName);
    if (index !== -1) {
      const updatedOrders = [...prevOrders];
      updatedOrders[index] = { ...updatedOrders[index], ...updatedOrder };
      return updatedOrders;
    }
    console.log(`Order with name "${orderName}" not found.`);
    return prevOrders;
  });
};

  useEffect(() => {
    props.update(ordersInTable)
    const updateVisibleColumns = () => {
      if (window.innerWidth <= 1024) {
        setVisibleColumns(new Set(['unit', 'unitPrice']))
      } else {
        setVisibleColumns(new Set(orderColumns.map((c) => c.uid)))
      }
    }

    updateVisibleColumns()
    window.addEventListener('resize', updateVisibleColumns)
    return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [ordersInTable])

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return orderColumns
    return orderColumns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = React.useMemo(() => {
    let filteredOrders = [...(ordersInTable || [])]

    if (hasSearchFilter) {
      filteredOrders = filteredOrders.filter((order) =>
        order.unit.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredOrders
  }, [ordersInTable, filterValue])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof OrderInTable]
      const second = b[sortDescriptor.column as keyof OrderInTable]
      const cmp = first !== null && first !== undefined && second !== null && second !== undefined
        ? first < second
          ? -1
          : first > second
            ? 1
            : 0
        : 0
      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1)
    }
  }, [page, pages])

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page])

  // const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setRowsPerPage(Number(e.target.value))
  //   setPage(1)
  // }, [])

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value)
      setPage(1)
    } else {
      setFilterValue('')
    }
  }, [])

  const onClear = React.useCallback(() => {
    setFilterValue('')
    setPage(1)
  }, [])

  const renderCell = React.useCallback((order: OrderInTable, columnKey: React.Key) => {
    const cellValue = order[columnKey as keyof OrderInTable]
    switch (columnKey) {
      case 'unit':
        return (
          <div>
            <p className="text-bold">{order.unit}</p>
          </div>
        )
      case 'unitPrice':
        return (
          <div>
            ${order.unitPrice}
          </div>
        )
      case 'total':
        return (
        <div>
            ${order.total}
          </div>
        )
      case 'action':
        if (Array.isArray(cellValue)) {
          return (
              <div className='flex gap-4'>
                  <EditOrderFormPopUp edit={editOrder} order={order}/>
                  <Button onClick={() => deleteOrder(order.unit)} isIconOnly size='sm'>{cellValue[1]}</Button>
              </div>
          );
      } else {
          console.error("Expected 'action' to be an array, but got:", cellValue);
          return null;
      }
      default:
        return cellValue
    }
  }, [])

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            type="text"
            placeholder={'Search by Name'}
            size="md"
            radius="sm"
            variant="bordered"
            className="max-w-sm"
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
            value={filterValue}
            onClear={onClear}
            onValueChange={onSearchChange}
            startContent={<Search className="text-secondary-400" size={18} strokeWidth={1} />}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  radius="sm"
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {toCapitalCase(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
              <OrderFormPopUp add={addOrder}/>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">
            Total {ordersInTable?.length} ordes
          </span>
          {/* <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent rounded-md text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="5">2</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label> */}
        </div>
      </div>
    )
  }, [
    filterValue,
    visibleColumns,
    // onRowsPerPageChange,
    ordersInTable?.length,
    onSearchChange,
    hasSearchFilter
  ])

  const bottomContent = React.useMemo(() => {
    return (
      <div className="z-0 flex items-center justify-between px-2 py-2">
        <Pagination
          isCompact
          showControls
          showShadow
          color="danger"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    )
  }, [items.length, page, pages, hasSearchFilter])

  // if (isLoading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Spinner />
  //     </div>
  //   )
  // }

  return (
    <div>
      <div className="z-0 w-full px-4 py-4 md:px-4">
        <Table
          className="z-0"
          aria-label="Example table with custom cells, pagination and sorting"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] px-0 shadow-none py-0 rounded-none',
          }}
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === 'actions' ? 'center' : 'start'}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={'No orders found'} items={sortedItems}>
            {(item) => (
              <TableRow key={item.unit}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const CakeTable = (props: cakeTableProps) => {
  const [filterValue, setFilterValue] = React.useState('')
  const[visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_CAKES_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(2)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'type',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [cakesInTable, setCakesInTable] = React.useState<CakeInTable[]>([])

  const hasSearchFilter = Boolean(filterValue)

  const addCake =  (cake: CakeInTable) => {
    setCakesInTable([...cakesInTable, cake])
  }

  // Function to delete an activity by name
  const deleteCake = (cakeName: string) => {
    setCakesInTable(prevCakes =>
      prevCakes.filter(cake => cake.type !== cakeName)
    );
  };

// Function to edit an activity by name
const editCake = (cakeName: string, updatedCake: Partial<CakeInTable>) => {
  setCakesInTable(prevCakes => {
    const index = prevCakes.findIndex(cake => cake.type === cakeName);
    if (index !== -1) {
      const updatedCakes = [...prevCakes];
      updatedCakes[index] = { ...updatedCakes[index], ...updatedCake };
      return updatedCakes;
    }
    console.log(`Cake with name "${cakeName}" not found.`);
    return prevCakes;
  });
};

  useEffect(() => {
    props.update(cakesInTable)
    const updateVisibleColumns = () => {
      if (window.innerWidth <= 1024) {
        setVisibleColumns(new Set(['type', 'price']))
      } else {
        setVisibleColumns(new Set(cakeColumns.map((c) => c.uid)))
      }
    }

    updateVisibleColumns()
    window.addEventListener('resize', updateVisibleColumns)
    return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [cakesInTable])

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return cakeColumns
    return cakeColumns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = React.useMemo(() => {
    let filteredCakes = [...(cakesInTable || [])]

    if (hasSearchFilter) {
      filteredCakes = filteredCakes.filter((cake) =>
        cake.type.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredCakes
  }, [cakesInTable, filterValue])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof CakeInTable]
      const second = b[sortDescriptor.column as keyof CakeInTable]
      const cmp = first !== null && first !== undefined && second !== null && second !== undefined
        ? first < second
          ? -1
          : first > second
            ? 1
            : 0
        : 0
      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1)
    }
  }, [page, pages])

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page])

  // const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setRowsPerPage(Number(e.target.value))
  //   setPage(1)
  // }, [])

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value)
      setPage(1)
    } else {
      setFilterValue('')
    }
  }, [])

  const onClear = React.useCallback(() => {
    setFilterValue('')
    setPage(1)
  }, [])

  const renderCell = React.useCallback((cake: CakeInTable, columnKey: React.Key) => {
    const cellValue = cake[columnKey as keyof CakeInTable]
    switch (columnKey) {
      case 'type':
        return (
          <div>
            <p className="text-bold">{cake.type}</p>
          </div>
        )
      case 'price':
        return (
          <div>
            ${cake.price}
          </div>
        )
      case 'action':
        if (Array.isArray(cellValue)) {
          return (
              <div className='flex gap-4'>
                  <EditCakeFormPopUp edit={editCake} cake={cake}/>
                  <Button onClick={() => deleteCake(cake.type)} isIconOnly size='sm'>{cellValue[1]}</Button>
              </div>
          );
      } else {
          console.error("Expected 'action' to be an array, but got:", cellValue);
          return null;
      }
      default:
        return cellValue
    }
  }, [])

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            type="text"
            placeholder={'Search by Name'}
            size="md"
            radius="sm"
            variant="bordered"
            className="max-w-sm"
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
            value={filterValue}
            onClear={onClear}
            onValueChange={onSearchChange}
            startContent={<Search className="text-secondary-400" size={18} strokeWidth={1} />}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  radius="sm"
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {toCapitalCase(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
              <CakeFormPopUp add={addCake}/>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">
            Total {cakesInTable?.length} cakes
          </span>
          {/* <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent rounded-md text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="5">2</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label> */}
        </div>
      </div>
    )
  }, [
    filterValue,
    visibleColumns,
    // onRowsPerPageChange,
    cakesInTable?.length,
    onSearchChange,
    hasSearchFilter
  ])

  const bottomContent = React.useMemo(() => {
    return (
      <div className="z-0 flex items-center justify-between px-2 py-2">
        <Pagination
          isCompact
          showControls
          showShadow
          color="danger"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    )
  }, [items.length, page, pages, hasSearchFilter])

  // if (isLoading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Spinner />
  //     </div>
  //   )
  // }

  return (
    <div>
      <div className="z-0 w-full px-4 py-4 md:px-4">
        <Table
          className="z-0"
          aria-label="Example table with custom cells, pagination and sorting"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] px-0 shadow-none py-0 rounded-none',
          }}
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === 'actions' ? 'center' : 'start'}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={'No cakes found'} items={sortedItems}>
            {(item) => (
              <TableRow key={item.type}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const ExtraTable = (props: extraTableProps) => {
  const [filterValue, setFilterValue] = React.useState('')
  const[visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_EXTRAS_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(2)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'unitPrice',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [extrasInTable, setExtrasInTable] = React.useState<ExtraInTable[]>([])

  const hasSearchFilter = Boolean(filterValue)

  const addExtra =  (extra: ExtraInTable) => {
    setExtrasInTable([...extrasInTable, extra])
  }

  // Function to delete an activity by name
  const deleteExtra = (extraDesc: string) => {
    setExtrasInTable(prevExtras =>
      prevExtras.filter(extra => extra.description !== extraDesc)
    );
  };

// Function to edit an activity by name
const editExtra = (extraDesc: string, updatedExtra: Partial<ExtraInTable>) => {
  setExtrasInTable(prevExtras => {
    const index = prevExtras.findIndex(extra => extra.description === extraDesc);
    if (index !== -1) {
      const updatedExtras = [...prevExtras];
      updatedExtras[index] = { ...updatedExtras[index], ...updatedExtra };
      return updatedExtras;
    }
    console.log(`Order with name "${extraDesc}" not found.`);
    return prevExtras;
  });
};

  useEffect(() => {
    props.update(extrasInTable)
    const updateVisibleColumns = () => {
      if (window.innerWidth <= 1024) {
        setVisibleColumns(new Set(['description', 'unitPrice']))
      } else {
        setVisibleColumns(new Set(extraColumns.map((c) => c.uid)))
      }
    }

    updateVisibleColumns()
    window.addEventListener('resize', updateVisibleColumns)
    return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [extrasInTable])

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return extraColumns
    return extraColumns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = React.useMemo(() => {
    let filteredExtras = [...(extrasInTable || [])]

    if (hasSearchFilter) {
      filteredExtras = filteredExtras.filter((extra) =>
        extra.description.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredExtras
  }, [extrasInTable, filterValue])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof ExtraInTable]
      const second = b[sortDescriptor.column as keyof ExtraInTable]
      const cmp = first !== null && first !== undefined && second !== null && second !== undefined
        ? first < second
          ? -1
          : first > second
            ? 1
            : 0
        : 0
      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, items])

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1)
    }
  }, [page, pages])

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page])

  // const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setRowsPerPage(Number(e.target.value))
  //   setPage(1)
  // }, [])

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value)
      setPage(1)
    } else {
      setFilterValue('')
    }
  }, [])

  const onClear = React.useCallback(() => {
    setFilterValue('')
    setPage(1)
  }, [])

  const renderCell = React.useCallback((extra: ExtraInTable, columnKey: React.Key) => {
    const cellValue = extra[columnKey as keyof ExtraInTable]
    switch (columnKey) {
      case 'unitPrice':
        return (
          <div>
            ${extra.unitPrice}
          </div>
        )
      case 'total':
        return (
        <div>
            ${extra.total}
          </div>
        )
      case 'action':
        if (Array.isArray(cellValue)) {
          return (
              <div className='flex gap-4'>
                  <EditExtraFormPopUp edit={editExtra} extra={extra}/>
                  <Button onClick={() => deleteExtra(extra.description)} isIconOnly size='sm'>{cellValue[1]}</Button>
              </div>
          );
      } else {
          console.error("Expected 'action' to be an array, but got:", cellValue);
          return null;
      }
      default:
        return cellValue
    }
  }, [])

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            type="text"
            placeholder={'Search by Name'}
            size="md"
            radius="sm"
            variant="bordered"
            className="max-w-sm"
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
            value={filterValue}
            onClear={onClear}
            onValueChange={onSearchChange}
            startContent={<Search className="text-secondary-400" size={18} strokeWidth={1} />}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  radius="sm"
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {toCapitalCase(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
              <ExtraFormPopUp add={addExtra}/>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">
            Total {extrasInTable?.length} extras
          </span>
          {/* <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent rounded-md text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="5">2</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label> */}
        </div>
      </div>
    )
  }, [
    filterValue,
    visibleColumns,
    // onRowsPerPageChange,
    extrasInTable?.length,
    onSearchChange,
    hasSearchFilter
  ])

  const bottomContent = React.useMemo(() => {
    return (
      <div className="z-0 flex items-center justify-between px-2 py-2">
        <Pagination
          isCompact
          showControls
          showShadow
          color="danger"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    )
  }, [items.length, page, pages, hasSearchFilter])

  // if (isLoading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Spinner />
  //     </div>
  //   )
  // }

  return (
    <div>
      <div className="z-0 w-full px-4 py-4 md:px-4">
        <Table
          className="z-0"
          aria-label="Example table with custom cells, pagination and sorting"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] px-0 shadow-none py-0 rounded-none',
          }}
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === 'actions' ? 'center' : 'start'}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={'No extras found'} items={sortedItems}>
            {(item) => (
              <TableRow key={item.description}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
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

export default function CreateEventPage() {
  const { createEvent } = useEvents()
  const [activities, setAcitivities] = React.useState<ActivityInTable[]>([])
  const [orders, setOrders] = React.useState<OrderInTable[]>([])
  const [cakes, setCakes] = React.useState<CakeInTable[]>([])
  const [extras, setExtras] = React.useState<ExtraInTable[]>([])
  const router = useRouter()

  const update = (activities: ActivityInTable[]) => {
    setAcitivities(activities)
  }

  const updateOrders = (orders: OrderInTable[]) => {
    setOrders(orders)
  }

  const updateCakes = (cakes: CakeInTable[]) => {
    setCakes(cakes);
  }

  const updateExtras = (extras: ExtraInTable[]) => {
    setExtras(extras);
  }

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
      let newActivities = activities.map((activity: ActivityInTable) => ({
        name: activity.name,
        description: activity.description,
        price: activity.price
      }))

      let newOrders = orders.map((order: OrderInTable) => ({
        unit: order.unit,
        description: order.description,
        unitPrice: order.unitPrice,
        quantity: order.quantity
      }))

      let newCakes = cakes.map((cake: CakeInTable) => ({
        description: cake.description,
        type: cake.type,
        price: cake.price
      }))

      let newExtras = extras.map((extra: ExtraInTable) => ({
        description: extra.description,
        unitPrice: extra.unitPrice,
        quantity: extra.quantity
      }))

      const newEvent = {
        title: data.title,
        category: data.category,
        location: data.location,
        status: status,
        price: data.price,
        extraKidPrice: data.extraKidPrice,
        minimumCharge: data.minimumCharge,
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

      await createEvent(newEvent, newActivities, newOrders, newCakes, newExtras)
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
              <Input
                type='number'
                isRequired
                variant='underlined'
                label='Minimum Charge'
                isClearable
                {...register('minimumCharge')}
                isInvalid={!!errors.minimumCharge}
                errorMessage={errors.minimumCharge?.message}
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
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          title='Activity Information' 
          description='Enter the event activities'
          form={<ActivityTable update={update}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          title='Order Information' 
          description='Enter the event orders'
          form={<OrderTable update={updateOrders}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          title='Cake Information' 
          description='Enter the event cakes'
          form={<CakeTable update={updateCakes}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          title='Extra Decorations and Themes Information' 
          description='Enter the event extras'
          form={<ExtraTable update={updateExtras}/>}
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
