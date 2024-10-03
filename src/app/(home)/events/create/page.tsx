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
  ModalFooter,
  Skeleton
} from '@nextui-org/react'
import Joi, { number } from 'joi'
import React, { useEffect, useState } from 'react'
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
import { Activity, ActivityType } from '@/api/models/Activity.model'
import { Extra, ExtraType } from '@/api/models/Extra.model'
import { Order, OrderType, UnitType } from '@/api/models/Order.model'
import { Cake, CakeDescription } from '@/api/models/Cake.model'

const INITIAL_VISIBLE_COLUMNS = [
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
  'description',
  'type',
  'unitPrice',
  'quantity',
  'total',
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
  { name: 'Description', uid: 'description', sortable: true},
  { name: 'Type', uid: 'type', sortable: true},
  { name: 'Unit Price', uid: 'unitPrice', sortable: true},
  { name: 'Quantity', uid: 'quantity', sortable: true},
  { name: 'Total', uid: 'total', sortable: true},
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
  horizontalScroll: boolean
}

type ActivityInTable = {
  description: ActivityType
  price: number
  action?: string
  isEnabled: boolean
}

type OrderInTable = {
  description: OrderType
  unit: UnitType | undefined
  unitPrice: number
  quantity: number
  total?: number
  action?: any[]
  isEnabled: boolean
}

type CakeInTable = {
  type: string
  description: CakeDescription
  unitPrice: number
  quantity: number
  total?: number
  action?: any[]
  isEnabled: boolean
}

type ExtraInTable = {
  description: ExtraType
  unitPrice: number
  quantity: number
  total?: number
  action?: any[]
  isEnabled: boolean
}

type ActivityTableProps = {
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
  price: Joi.number().min(0).required().messages({
    'number.min': 'Activity price cannot be negative',
    'any.required': 'Activity price is required',
  })
})

const orderSchema = Joi.object({
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
  unitPrice: Joi.number().min(0).required().messages({
    'number.min': 'Order price cannot be negative',
    'any.required': 'Order price is required',
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Order quantity cannot be less than one',
    'any.required': 'Order price is required',
  })
})

const extraSchema = Joi.object({
  unitPrice: Joi.number().min(0).required().messages({
    'number.min': 'Extra price cannot be negative',
    'any.required': 'Extra price is required',
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Extra quantity cannot be less than one',
    'any.required': 'Extra quantity is required',
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
  minimumCharge: Joi.number().min(0).optional().messages({
    'number.min': 'Amount due cannot be negative',
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

const ActivityTable = (props: ActivityTableProps) => {
  const initialActivities: ActivityInTable[] = Object.values(ActivityType).map(type => ({
    description: type,
    isEnabled: false,
    price: 0
  }));

  const [filterValue, setFilterValue] = React.useState('')
  const[visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(17)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'description',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [activitiesInTable, setActivitiesInTable] = React.useState<ActivityInTable[]>(initialActivities)
  const [activitiesToSend, setActivitiesToSend] = React.useState<Partial<Activity>[]>([])

  const hasSearchFilter = Boolean(filterValue)

  const addActivity =  (activity: ActivityInTable) => {
    setActivitiesToSend(prevActivities => [...prevActivities, activity])
  }

  // Function to delete an activity by name
  const deleteActivity = (activityDescription: string) => {
    setActivitiesToSend(prevActivities =>
      prevActivities.filter(activity => activity.description !== activityDescription)
    );
  };

  useEffect(() => {
    let totalPrice = activitiesToSend.reduce(
      (sum, activity) => sum + activity.price!,
      0
    );
    props.update(activitiesToSend, totalPrice)
  }, [activitiesToSend])

  // useEffect(() => {
  //   const updateVisibleColumns = () => {
  //     if (window.innerWidth <= 1024) {
  //       setVisibleColumns(new Set(['name', 'price']))
  //     } else {
  //       setVisibleColumns(new Set(columns.map((c) => c.uid)))
  //     }
  //   }

  //   updateVisibleColumns()
  //   window.addEventListener('resize', updateVisibleColumns)
  //   return () => window.removeEventListener('resize', updateVisibleColumns)
  // }, [activitiesInTable])

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return columns
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = React.useMemo(() => {
    let filteredActivities = [...(activitiesInTable || [])]

    if (hasSearchFilter) {
      filteredActivities = filteredActivities.filter((activity) =>
        activity.description.toLowerCase().includes(filterValue.toLowerCase())
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
      case 'description':
        return (
          <div>
            <p className="text-bold">{activity.description}</p>
          </div>
        )
      case 'price':
        return (
          <Input
            type='number'
            value={activity.price?.toString() ?? '0'}
            placeholder='Set Price'
            isRequired={true}
            className="mt-4 md:max-w-72"
            variant='underlined'
            onChange={(e) => {
              const newPrice = parseInt(e.target.value);
              const {error} = activitySchema.validate({price: newPrice});

              if (error) {
                console.error(error.message);
                toast.error(error.message);
              }
              setActivitiesInTable((prevActivities) =>
                prevActivities.map((a) =>
                  a.description === activity.description ? { ...a, price: newPrice } : a)
                
              )
            }}
          />
        )
      case 'action':
        if (activity.isEnabled) {
          return (
            <Button
            color="danger"
        radius="sm"
        variant="solid"
              onClick={() => {
                setActivitiesInTable(prevActivities =>
                  prevActivities.map(a =>
                    a.description === activity.description ? { ...a, isEnabled: false } : a
                  )
                );
                deleteActivity(activity.description);
              }}
              isIconOnly
              size='sm'
            >
              <Trash2 size={22}/>
            </Button>
          );
        } else {
          return (
            <Button
            color="danger"
        radius="sm"
        variant="solid"
              onClick={() => {
                setActivitiesInTable(prevActivities =>
                  prevActivities.map(a =>
                    a.description === activity.description ? { ...a, isEnabled: true } : a
                  )
                );
                addActivity(activity);
              }}
              isIconOnly
              size='sm'
            >
              <PlusIcon size={22} />
            </Button>
          );
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
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">
            Total {activitiesInTable?.length} activities
          </span>
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
          // bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] w-[382px] md:w-full px-0 shadow-none py-0 rounded-none',
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

const OrderTable = (props: orderTableProps) => {
  const initialOrders: OrderInTable[] = Object.values(OrderType).map(type => ({
    description: type,
    isEnabled: false,
    unitPrice: 0,
    quantity: 1,
    unit: undefined
  }))
  const [filterValue, setFilterValue] = React.useState('')
  const[visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_ORDERS_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(47)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'description',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [ordersInTable, setOrdersInTable] = React.useState<OrderInTable[]>(initialOrders)
  const [ordersToSend, setOrdersToSend] = React.useState<Partial<Order>[]>([])

  const hasSearchFilter = Boolean(filterValue)

  const addOrder =  (order: OrderInTable) => {
    setOrdersToSend(prevOrders => [...prevOrders, order])
  }

  // Function to delete an activity by name
  const deleteOrder = (orderName: string) => {
    setOrdersToSend(prevOrders =>
      prevOrders.filter(order => order.description !== orderName)
    );
  };

  useEffect(() => {
    let totalPrice = ordersToSend.reduce(
      (sum, order) => sum + order.unitPrice!,
      0
    );
    props.update(ordersToSend, totalPrice)
  }, [ordersToSend])

  // useEffect(() => {
  //   const updateVisibleColumns = () => {
  //     if (window.innerWidth <= 1024) {
  //       setVisibleColumns(new Set(['unit', 'unitPrice']))
  //     } else {
  //       setVisibleColumns(new Set(orderColumns.map((c) => c.uid)))
  //     }
  //   }

  //   updateVisibleColumns()
  //   window.addEventListener('resize', updateVisibleColumns)
  //   return () => window.removeEventListener('resize', updateVisibleColumns)
  // }, [ordersInTable])

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return orderColumns
    return orderColumns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = React.useMemo(() => {
    let filteredOrders = [...(ordersInTable || [])]

    if (hasSearchFilter) {
      filteredOrders = filteredOrders.filter((order) =>
        order.description.toLowerCase().includes(filterValue.toLowerCase())
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

  const handleChange = (newValue: any, order: OrderInTable) => {
      setOrdersInTable((prevOrders) =>
        prevOrders.map((o) => 
          o.description === order.description ? { ...o, unit: newValue} : o
        ))
    
  };

  const renderCell = React.useCallback((order: OrderInTable, columnKey: React.Key) => {
    const cellValue = order[columnKey as keyof OrderInTable]
    switch (columnKey) {
      case 'description':
        return (
          <div>
            <p className="text-bold">{order.description}</p>
          </div>
        )
      case 'unit':
        return (
                  <Autocomplete
                    label="Select Unit"
                    className="mt-4 md:max-w-72"
                    variant="underlined"
                    isRequired
                    value={order.unit}
                    selectedKey={order.unit}
                    onSelectionChange={(value) => handleChange(value, order)}
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
                    <AutocompleteItem key={`${UnitType.KG}`} value={`${UnitType.KG}`}>
                      KG
                    </AutocompleteItem>
                    <AutocompleteItem key={`${UnitType.DZ}`} value={`${UnitType.DZ}`}>
                      DZ
                    </AutocompleteItem>
                    <AutocompleteItem key={`${UnitType.UN}`} value={`${UnitType.UN}`}>
                      UN
                    </AutocompleteItem>
                  </Autocomplete>
                
        )
      case 'unitPrice':
        return (
            <Input
              type='number'
              value={order.unitPrice?.toString() ?? '0'}
              placeholder='Set Price'
              isRequired={true}
              className="mt-4 md:max-w-72"
              variant='underlined'
              onChange={(e) => {
                const newPrice = parseInt(e.target.value);
                const {error} = orderSchema.validate({unitPrice: newPrice, quantity: order.quantity});
  
                if (error) {
                  console.error(error.message);
                  toast.error(error.message);
                }
                setOrdersInTable((prevOrders) =>
                  prevOrders.map((o) =>
                    o.description === order.description ? { ...o, unitPrice: newPrice } : o)
                  
                )
              }}
            />
          )
      case 'quantity':
        return (
          <Input
            type='number'
            value={order.quantity?.toString() ?? '1'}
            placeholder='Set Quantity'
            isRequired={true}
            className="mt-4 md:max-w-72"
            variant='underlined'
            onChange={(e) => {
              const newQuantity = parseInt(e.target.value);
              const {error} = orderSchema.validate({quantity: newQuantity, unitPrice: order.unitPrice});

              if (error) {
                console.error(error.message);
                toast.error(error.message);
              }
              setOrdersInTable((prevOrders) =>
                prevOrders.map((o) =>
                  o.description === order.description ? { ...o, quantity: newQuantity } : o)
                
              )
            }}
          />
        )
      case 'total':
        return (
        <div>
            ${order.quantity && order.unitPrice ? (order.quantity * order.unitPrice) : 0}
          </div>
        )
        case 'action':
          if (order.isEnabled) {
            return (
              <Button
              color="danger"
              radius="sm"
              variant="solid"
                onClick={() => {
                  setOrdersInTable(prevOrders =>
                    prevOrders.map(o =>
                      o.description === o.description ? { ...o, isEnabled: false } : o
                    )
                  );
                  deleteOrder(order.description);
                }}
                isIconOnly
                size='sm'
              >
                <Trash2 size={22}/>
              </Button>
            );
          } else {
            return (
              <Button
              color="danger"
              radius="sm"
              variant="solid"
                onClick={() => {
                  setOrdersInTable(prevOrders =>
                    prevOrders.map(o =>
                      o.description === order.description ? { ...o, isEnabled: true } : o
                    )
                  );
                  addOrder(order);
                }}
                isIconOnly
                size='sm'
              >
                <PlusIcon size={22} />
              </Button>
            );
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
      <div className="z-0 w-full px-4 py-4 md:px-4 overflow-x-auto">
        <Table
          className="z-0"
          aria-label="Example table with custom cells, pagination and sorting"
          isHeaderSticky
          // bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] w-full px-0 shadow-none py-0 rounded-none',
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

const CakeTable = (props: cakeTableProps) => {
  const initialCakes: CakeInTable[] = Object.values(CakeDescription).map(type => ({
    description: type,
    isEnabled: false,
    unitPrice: 0,
    quantity: 1,
    type: ''
  }))
  const [filterValue, setFilterValue] = React.useState('')
  const[visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_CAKES_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(3)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'description',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [cakesInTable, setCakesInTable] = React.useState<CakeInTable[]>(initialCakes)
  const [cakesToSend, setCakesToSend] = React.useState<Partial<Cake>[]>([])

  const hasSearchFilter = Boolean(filterValue)

  const addCake =  (cake: CakeInTable) => {
    setCakesToSend(prevCakes => [...prevCakes, cake])
  }

  // Function to delete an activity by name
  const deleteCake = (cakeName: string) => {
    setCakesToSend(prevCakes =>
      prevCakes.filter(cake => cake.description !== cakeName)
    );
  };

  useEffect(() => {
    let totalPrice = cakesToSend.reduce(
      (sum, cake) => sum + cake.unitPrice!,
      0
    );
    props.update(cakesToSend, totalPrice)
  }, [cakesToSend])

  // useEffect(() => {
  //   const updateVisibleColumns = () => {
  //     if (window.innerWidth <= 1024) {
  //       setVisibleColumns(new Set(['type', 'price']))
  //     } else {
  //       setVisibleColumns(new Set(cakeColumns.map((c) => c.uid)))
  //     }
  //   }

  //   updateVisibleColumns()
  //   window.addEventListener('resize', updateVisibleColumns)
  //   return () => window.removeEventListener('resize', updateVisibleColumns)
  // }, [cakesInTable])

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return cakeColumns
    return cakeColumns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = React.useMemo(() => {
    let filteredCakes = [...(cakesInTable || [])]

    if (hasSearchFilter) {
      filteredCakes = filteredCakes.filter((cake) =>
        cake.description.toLowerCase().includes(filterValue.toLowerCase())
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
      case 'description':
        return (
          <div>
            <p className="text-bold break-words max-w-[255px]">{cake.description}</p>
          </div>
        )
      case 'type':
        return (
          <Input
                type='text'
                value={cake.type ?? ''}
                placeholder='Enter Type'
                isRequired={true}
                className="mt-4 md:max-w-72"
                variant='underlined'
                onChange={(e) => {
                  const newType = e.target.value;
                  const {error} = cakeSchema.validate({unitPrice: cake.unitPrice, quantity: cake.quantity, type: newType});
    
                  if (error) {
                    console.error(error.message);
                    toast.error(error.message);
                  }
                  setCakesInTable((prevCakes) =>
                    prevCakes.map((c) =>
                      c.description === cake.description ? { ...c, type: newType } : c)
                    
                  )
                }}
              />
        )
      case 'unitPrice':
          return (
              <Input
                type='number'
                value={cake.unitPrice?.toString() ?? '0'}
                placeholder='Set Price'
                isRequired={true}
                className="mt-4 md:max-w-72"
                variant='underlined'
                onChange={(e) => {
                  const newPrice = parseInt(e.target.value);
                  const {error} = cakeSchema.validate({unitPrice: newPrice, quantity: cake.quantity, type: cake.type});
    
                  if (error) {
                    console.error(error.message);
                    toast.error(error.message);
                  }
                  setCakesInTable((prevCakes) =>
                    prevCakes.map((c) =>
                      c.description === cake.description ? { ...c, unitPrice: newPrice } : c)
                    
                  )
                }}
              />
            )
        case 'quantity':
          return (
            <Input
              type='number'
              value={cake.quantity?.toString() ?? '1'}
              placeholder='Set Quantity'
              isRequired={true}
              className="mt-4 md:max-w-72"
              variant='underlined'
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value);
                const {error} = cakeSchema.validate({quantity: newQuantity, unitPrice: cake.unitPrice, type: cake.type});
  
                if (error) {
                  console.error(error.message);
                  toast.error(error.message);
                }
                setCakesInTable((prevCakes) =>
                  prevCakes.map((c) =>
                    c.description === cake.description ? { ...c, quantity: newQuantity } : c)
                  
                )
              }}
            />
          )
        case 'total':
          return (
          <div>
              ${cake.quantity && cake.unitPrice ? (cake.quantity * cake.unitPrice) : 0}
            </div>
          )
          case 'action':
            if (cake.isEnabled) {
              return (
                <Button
                color="danger"
                radius="sm"
                variant="solid"
                  onClick={() => {
                    setCakesInTable(prevCakes =>
                      prevCakes.map(c =>
                        c.description === c.description ? { ...c, isEnabled: false } : c
                      )
                    );
                    deleteCake(cake.description);
                  }}
                  isIconOnly
                  size='sm'
                >
                  <Trash2 size={22}/>
                </Button>
              );
            } else {
              return (
                <Button
                color="danger"
                radius="sm"
                variant="solid"
                  onClick={() => {
                    setCakesInTable(prevCakes =>
                      prevCakes.map(c =>
                        c.description === cake.description ? { ...c, isEnabled: true } : c
                      )
                    );
                    addCake(cake);
                  }}
                  isIconOnly
                  size='sm'
                >
                  <PlusIcon size={22} />
                </Button>
              );
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
          // bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] w-[382px] md:w-full px-0 shadow-none py-0 rounded-none',
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

const ExtraTable = (props: extraTableProps) => {
  const initialExtras: ExtraInTable[] = Object.values(ExtraType).map(type => ({
    description: type,
    isEnabled: false,
    unitPrice: 0,
    quantity: 1,
  }))
  const [filterValue, setFilterValue] = React.useState('')
  const[visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_EXTRAS_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(11)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'description',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [extrasInTable, setExtrasInTable] = React.useState<ExtraInTable[]>(initialExtras)
  const [extrasToSend, setExtrasToSend] = React.useState<Partial<Extra>[]>([])

  const hasSearchFilter = Boolean(filterValue)

  const addExtra =  (extra: ExtraInTable) => {
    setExtrasToSend(prevExtras => [...prevExtras, extra])
  }

  // Function to delete an activity by name
  const deleteExtra = (extraDesc: string) => {
    setExtrasToSend(prevExtras =>
      prevExtras.filter(extra => extra.description !== extraDesc)
    );
  };

  useEffect(() => {
    let totalPrice = extrasToSend.reduce(
      (sum, extra) => sum + extra.unitPrice!,
      0
    );
    props.update(extrasToSend, totalPrice)
  }, [extrasToSend])

  // useEffect(() => {
  //   const updateVisibleColumns = () => {
  //     if (window.innerWidth <= 1024) {
  //       setVisibleColumns(new Set(['description', 'unitPrice']))
  //     } else {
  //       setVisibleColumns(new Set(extraColumns.map((c) => c.uid)))
  //     }
  //   }

  //   updateVisibleColumns()
  //   window.addEventListener('resize', updateVisibleColumns)
  //   return () => window.removeEventListener('resize', updateVisibleColumns)
  // }, [extrasInTable])

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
      case 'description':
        return (
          <div>
            <p className="text-bold">{extra.description}</p>
          </div>
        )
      case 'unitPrice':
        return (
            <Input
              type='number'
              value={extra.unitPrice?.toString() ?? '0'}
              placeholder='Set Price'
              isRequired={true}
              className="mt-4 md:max-w-72"
              variant='underlined'
              onChange={(e) => {
                const newPrice = parseInt(e.target.value);
                const {error} = extraSchema.validate({unitPrice: newPrice, quantity: extra.quantity});
  
                if (error) {
                  console.error(error.message);
                  toast.error(error.message);
                }
                setExtrasInTable((prevExtras) =>
                  prevExtras.map((e) =>
                    e.description === extra.description ? { ...e, unitPrice: newPrice } : e)
                  
                )
              }}
            />
          )
      case 'quantity':
        return (
          <Input
            type='number'
            value={extra.quantity?.toString() ?? '1'}
            placeholder='Set Quantity'
            isRequired={true}
            className="mt-4 md:max-w-72"
            variant='underlined'
            onChange={(e) => {
              const newQuantity = parseInt(e.target.value);
              const {error} = extraSchema.validate({quantity: newQuantity, unitPrice: extra.unitPrice});

              if (error) {
                console.error(error.message);
                toast.error(error.message);
              }
              setExtrasInTable((prevExtras) =>
                prevExtras.map((e) =>
                  e.description === extra.description ? { ...e, quantity: newQuantity } : e)
                
              )
            }}
          />
        )
      case 'total':
        return (
        <div>
            ${extra.quantity && extra.unitPrice ? (extra.quantity * extra.unitPrice) : 0}
          </div>
        )
        case 'action':
          if (extra.isEnabled) {
            return (
              <Button
              color="danger"
              radius="sm"
              variant="solid"
                onClick={() => {
                  setExtrasInTable(prevExtras =>
                    prevExtras.map(e =>
                      e.description === e.description ? { ...e, isEnabled: false } : e
                    )
                  );
                  deleteExtra(extra.description);
                }}
                isIconOnly
                size='sm'
              >
                <Trash2 size={22}/>
              </Button>
            );
          } else {
            return (
              <Button
              color="danger"
              radius="sm"
              variant="solid"
                onClick={() => {
                  setExtrasInTable(prevExtras =>
                    prevExtras.map(e =>
                      e.description === extra.description ? { ...e, isEnabled: true } : e
                    )
                  );
                  addExtra(extra);
                }}
                isIconOnly
                size='sm'
              >
                <PlusIcon size={22} />
              </Button>
            );
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
          // bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] w-[382px] md:w-full px-0 shadow-none py-0 rounded-none',
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
  const { title, description, form, horizontalScroll } = props
  return (
    <div className="mt-10 flex w-full flex-col items-start justify-start p-3 md:py-16 lg:flex-row lg:items-center">
      <div className="flex w-full flex-col md:w-[350px]">
        <h3 className="text-secondary-950 text-base dark:text-secondary-50">{title}</h3>
        <p className="mt-0.5 text-wrap text-small text-light-300 md:w-[90%]">{description}</p>
      </div>
      <div className={horizontalScroll ? "w-full overflow-x-auto" : undefined}>
        {form}
      </div>
    </div>
  )
}

export default function CreateEventPage() {
  const { createEvent } = useEvents()
  const [activities, setActivities] = React.useState<ActivityInTable[]>([])
  const [orders, setOrders] = React.useState<OrderInTable[]>([])
  const [cakes, setCakes] = React.useState<CakeInTable[]>([])
  const [extras, setExtras] = React.useState<ExtraInTable[]>([])
  const [activityTotal, setActivityTotal] = useState<number>(0)
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [cakeTotal, setCakeTotal] = useState<number>(0)
  const [extraTotal, setExtraTotal] = useState<number>(0)
  const [price, setPrice] = useState<number>(0)
  const [extraKidPrice, setExtraKidPrice] = useState<number>(0)
  const [minimumCharge, setMinimumCharge] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const router = useRouter()

  const update = (activities: ActivityInTable[], total: number) => {
    setActivities(activities)
    setActivityTotal(total)
    console.log(activities)
  }

  const updateOrders = (orders: OrderInTable[], total: number) => {
    setOrders(orders)
    setOrderTotal(total)
  }

  const updateCakes = (cakes: CakeInTable[], total: number) => {
    setCakes(cakes);
    setCakeTotal(total)
  }

  const updateExtras = (extras: ExtraInTable[], total: number) => {
    setExtras(extras);
    setExtraTotal(total);
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
        unitPrice: cake.unitPrice,
        quantity: cake.quantity
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
          horizontalScroll={false}
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
          horizontalScroll={false}
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
                    {Object.values(EventCategory).map((category) => (
                      <AutocompleteItem key={category} value={category}>
                        {toCapitalCase(category).replace('_', ' ')}
                      </AutocompleteItem>
                    ))}
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
          horizontalScroll={false}
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
          horizontalScroll={false}
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
                onChange={(e) => setPrice(Number(e.target.value))}
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
                onChange={(e) => setExtraKidPrice(Number(e.target.value))}
                isInvalid={!!errors.extraKidPrice}
                errorMessage={errors.extraKidPrice?.message}
                readOnly={isSubmitting}
              />
              <Input
                type='number'
                variant='underlined'
                label='Minimum Charge'
                isClearable
                {...register('minimumCharge')}
                onChange={(e) => setMinimumCharge(Number(e.target.value))}
                isInvalid={!!errors.minimumCharge}
                errorMessage={errors.minimumCharge?.message}
                readOnly={isSubmitting}
              />
              <Textarea
                label="Extra Note"
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
                onChange={(e) => setPaidAmount(Number(e.target.value))}
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
          horizontalScroll={true}
          title='Activity Information' 
          description='Enter the event activities'
          form={<ActivityTable update={update}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          horizontalScroll={true}
          title='Order Information' 
          description='Enter the event orders'
          form={<OrderTable update={updateOrders}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          horizontalScroll={true}
          title='Cake Information' 
          description='Enter the event cakes'
          form={<CakeTable update={updateCakes}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          horizontalScroll={true}
          title='Extra Decorations and Themes Information' 
          description='Enter the event extras'
          form={<ExtraTable update={updateExtras}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <h1 className="my-5 text-2xl font-bold m-12">Grand Total</h1>
        <div className="flex flex-col gap-5 m-12">
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Activities Total Price</p>
          {activityTotal ? (
            <p className="text-md text-light-400">${activityTotal}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-md text-light-300'>Orders Total Price</p>
          {orderTotal ? (
            <p className='text-md text-light-400'>${orderTotal}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Cakes Total Price</p>
          {cakeTotal ? (
            <p className="text-md text-light-400">${cakeTotal}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-md text-light-300'>Decorations and Themes Total Price</p>
          {extraTotal ? (
            <p className='text-md text-light-400'>${extraTotal}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Event Amount</p>
          {event ? (
            <p className="text-md text-light-400">${extraKidPrice + price}</p>
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
          <p className="text-md text-light-300">Grand Total</p>
          {event ? (
            <p className="text-md text-light-400">${(activityTotal + orderTotal + cakeTotal + extraTotal + extraKidPrice + minimumCharge + price) - paidAmount}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
      </div>
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
