'use client'
import { EventCategory, EventLocation } from '@/api/models/Event.model'
import { Time, parseDate } from '@internationalized/date'
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  CalendarDate,
  DatePicker,
  DateRangePicker,
  DateValue,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NextUIProvider,
  Pagination,
  Selection,
  SortDescriptor,
  Spacer,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  TimeInput,
  useDisclosure,
} from '@nextui-org/react'
import Joi from 'joi'
import React, { useEffect, useState } from 'react'
import { useEvents } from '@/app/(home)/contexts/EventContext'
import { Controller, useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, Edit, Plus, PlusIcon, Search, Trash2 } from 'lucide-react'
import { Event } from '@/api/models/Event.model'
import { parseTimeFromISO } from '@/utils/date'
import { toCapitalCase } from '@/utils/string'
import { ActivitiesApi } from '@/api/activity.api'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, ServerError } from '@/api/utils'
import { Activity, ActivityType } from '@/api/models/Activity.model'
import { OrdersApi } from '@/api/order.api'
import { Order, OrderType, UnitType } from '@/api/models/Order.model'
import { CakesApi } from '@/api/cake.api'
import { Cake, CakeDescription } from '@/api/models/Cake.model'
import { Extra, ExtraType } from '@/api/models/Extra.model'
import { ExtrasApi } from '@/api/extra.api'

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

type ActivityInTable = {
  id?: number
  description: ActivityType
  price: number
  action?: any[]
  isEnabled: boolean
}

type OrderInTable = {
  id?: number
  description: OrderType
  unit: UnitType | undefined
  unitPrice: number
  quantity: number
  total?: number
  action?: any[]
  isEnabled: boolean
}

type CakeInTable = {
  id?: number
  type: string
  description: CakeDescription
  unitPrice: number
  quantity: number
  total?: number
  action?: any[]
  isEnabled: boolean
}

type ExtraInTable = {
  id?: number
  description: ExtraType
  unitPrice: number
  quantity: number
  total?: number
  action?: any[]
  isEnabled: boolean
}

type activityTableProps = {
  update: Function
  id: number
}

type orderTableProps = {
  update: Function
  id: number
}

type cakeTableProps = {
  update: Function
  id: number
}

type extraTableProps = {
  update: Function
  id: number
}

type ActivityToSend = {
  newActivities: Partial<Activity>[]
  updatedActivities: Partial<Activity>[]
  deletedActivities: number[]
}

type OrderToSend = {
  newOrders: Partial<Order>[]
  updatedOrders: Partial<Order>[]
  deletedOrders: number[]
}

type CakeToSend = {
  newCakes: Partial<Cake>[]
  updatedCakes: Partial<Cake>[]
  deletedCakes: number[]
}

type ExtraToSend = {
  newExtras: Partial<Extra>[]
  updatedExtras: Partial<Extra>[]
  deletedExtras: number[]
}

type FormData = {
  clientName: string
  clientBirthday?: DateValue
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

interface SectionProps {
  form: React.ReactNode
  title: string
  description: string
  horizontalScroll: boolean
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
    'number.min': 'Cake price cannot be negative',
    'any.required': 'Cake price is required',
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Cake quantity cannot be less than one',
    'any.required': 'Cake price is required',
  })
})

const extraSchema = Joi.object({
  unitPrice: Joi.number().min(0).required().messages({
    'number.min': 'Extra price cannot be negative',
    'any.required': 'Extra price is required',
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Extra quantity cannot be less than one',
    'any.required': 'Extra price is required',
  })
})

const editEventSchema = Joi.object({
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
    'any.required': 'Event category is required',
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

const ActivityTable = (props: activityTableProps) => {
  const activitiesApi = new ActivitiesApi()

  const { data: activities, isLoading } = useQuery<ApiResponse<Activity[]>, ServerError>({
    queryKey: ['activities'],
    queryFn: async () => await activitiesApi.getActivities(),
    refetchInterval: 5000
  })

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

  const [activitiesInTable, setActivitiesInTable] = React.useState<ActivityInTable[]>([])
  const [newActivities, setNewActivities] = React.useState<ActivityInTable[]>([])
  const [updatedActivities, setUpdatedActivities] = React.useState<ActivityInTable[]>([])
  const [deletedActivities, setDeletedActivities] = React.useState<number[] | undefined>([])

  const hasSearchFilter = Boolean(filterValue)

  useEffect(() => {
    if (activities?.payload) {
      const activityInTableArray: ActivityInTable[] = activities.payload
        .filter(activity => activity.eventId === props.id) // Filter by eventId
        .map(activity => ({
          id: activity.id,
          description: activity.description,
          price: activity.price,
          isEnabled: true
        }));
        console.log(activityInTableArray)
      setActivitiesInTable(activityInTableArray);

      setActivitiesInTable(prevActivities => {
        const updatedActivities = [...prevActivities];
      
        Object.values(ActivityType).forEach(type => {
          let currentActivity = prevActivities.find(activity => activity.description === type);
          if (!currentActivity) {
            const newActivity = {
              description: type,
              price: 0,
              isEnabled: false
            };
            updatedActivities.push(newActivity);
          }
        });
      
        return updatedActivities;
      });
      
      
    }
  }, [activities, props.id]);
  
  
    useEffect(() => {
      props.update({newActivities, updatedActivities, deletedActivities})
      // const updateVisibleColumns = () => {
      //   if (window.innerWidth <= 1024) {
      //     setVisibleColumns(new Set(['description', 'price']))
      //   } else {
      //     setVisibleColumns(new Set(columns.map((c) => c.uid)))
      //   }
      // }
  
      // updateVisibleColumns()
      // window.addEventListener('resize', updateVisibleColumns)
      // return () => window.removeEventListener('resize', updateVisibleColumns)
    }, [activitiesInTable])

    const addActivity = (activity: ActivityInTable) => {
      const newActivity = { ...activity, isEnabled: true };
    
      setActivitiesInTable(prevActivities => {
        // Check if the activity already exists in the table
        const isActivityInTable = prevActivities.some(act => act.description === activity.description);
        
        if (!isActivityInTable) {
          return [...prevActivities, newActivity];
        } else {
          // If the activity exists, just return the previous state
          return prevActivities;
        }
      });
    
      setNewActivities(prevNewActivities => [...prevNewActivities, newActivity]);
    };
    

    const deleteActivity = (activityName: string) => {
      setActivitiesInTable(prevActivities => {
        return prevActivities.map(activity =>
          activity.description === activityName
            ? { ...activity, isEnabled: false }
            : activity
        );
      });
    
      setActivitiesInTable(prevActivities => {
        const deletedActivity = prevActivities.find(activity => activity.description === activityName);
    
        if (deletedActivity && deletedActivity.id) {
          // The activity is fetched from the database
          setDeletedActivities(prevDeleted => prevDeleted ? [...prevDeleted, deletedActivity.id!] : [deletedActivity.id!]);
        } else {
          // The activity is newly created
          setNewActivities(prevNewActivities => prevNewActivities.filter(activity => activity.description !== activityName));
        }
    
        return prevActivities; // return updated activities
      });
    };
    
  

    const editActivity = (activityName: string, updatedActivity: Partial<ActivityInTable>) => {
      setActivitiesInTable(prevActivities => {
        const updatedActivities = prevActivities.map(activity =>
          activity.description === activityName
            ? { ...activity, ...updatedActivity }
            : activity
        );
    
        const activityToUpdate = updatedActivities.find(activity => activity.description === activityName);
        console.log(activityToUpdate)
        if (activityToUpdate && activityToUpdate.id) {
          // Check if the activity is already in updatedActivities
          setUpdatedActivities(prevUpdated => {
            const isAlreadyUpdated = prevUpdated.some(activity => activity.id === activityToUpdate.id);
            console.log(isAlreadyUpdated)
            if (!isAlreadyUpdated) {
              console.log(`r`)
              return [...prevUpdated, activityToUpdate];
            } else {
              // If it's already in updatedActivities, just update the existing entry
              return prevUpdated.map(activity =>
                activity.id === activityToUpdate.id ? activityToUpdate : activity
          )}
        });
          } else if (activityToUpdate && !activityToUpdate.id) {
          // The activity is newly created, so update it in newActivities
          setNewActivities(prevNewActivities => {
            const updatedNewActivities = [...prevNewActivities];
            const newActivityIndex = updatedNewActivities.findIndex(activity => activity.description === activityName);
            updatedNewActivities[newActivityIndex] = { ...updatedNewActivities[newActivityIndex], ...updatedActivity };
            return updatedNewActivities;
          });
        }
    
        return updatedActivities; // return updated activities
      });
    };
    
  
  

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
    const cellValue = activity[columnKey as keyof ActivityInTable];
    
    switch (columnKey) {
      case 'description':
        return (
          <div>
            <p className="text-bold">{activity.description}</p>
          </div>
        );
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
              const { error } = activitySchema.validate({ price: newPrice });
  
              if (error) {
                console.error(error.message);
                toast.error(error.message);
              } else {
                // Update the activity in the table
                setActivitiesInTable((prevActivities) => {
                  const updatedActivities = prevActivities.map((a) =>
                    a.description === activity.description ? { ...a, price: newPrice } : a
                  );
                  return updatedActivities;
                });
  
                // Call editActivity after updating the price
                editActivity(activity.description, { price: newPrice });
              }
            }}
          />
        );
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
              <Trash2 size={22} />
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
        return cellValue;
    }
  }, []);
  

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
  const ordersApi = new OrdersApi();

  const { data: orders, isLoading } = useQuery<ApiResponse<Order[]>, ServerError>({
    queryKey: ['orders'],
    queryFn: async () => await ordersApi.getOrders(),
    refetchInterval: 5000,
  });

  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(INITIAL_ORDERS_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(47);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'description',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);

  const [ordersInTable, setOrdersInTable] = useState<OrderInTable[]>([]);
  const [newOrders, setNewOrders] = useState<OrderInTable[]>([]);
  const [updatedOrders, setUpdatedOrders] = useState<OrderInTable[]>([]);
  const [deletedOrders, setDeletedOrders] = useState<number[] | undefined>([]);

  const hasSearchFilter = Boolean(filterValue);

  useEffect(() => {
    if (orders?.payload) {
      const orderInTableArray: OrderInTable[] = orders.payload
        .filter(order => order.eventId === props.id) // Filter by eventId
        .map(order => ({
          id: order.id,
          unit: order.unit,
          description: order.description,
          unitPrice: order.unitPrice,
          quantity: order.quantity,
          total: order.unitPrice * order.quantity,
          isEnabled: true,
        }));
      setOrdersInTable(orderInTableArray);

      setOrdersInTable(prevOrders => {
        const updatedOrders = [...prevOrders];

        Object.values(OrderType).forEach(type => {
          let currentOrder = prevOrders.find(order => order.description === type);
          if (!currentOrder) {
            const newOrder = {
              description: type,
              unitPrice: 0,
              quantity: 1,
              isEnabled: false,
              unit: undefined
            }
            updatedOrders.push(newOrder);
          }
        });

        return updatedOrders;
      })
    }
  }, [orders, props.id]);

  useEffect(() => {
    props.update({ newOrders, updatedOrders, deletedOrders });

    // const updateVisibleColumns = () => {
    //   if (window.innerWidth <= 1024) {
    //     setVisibleColumns(new Set(['unit', 'unitPrice']));
    //   } else {
    //     setVisibleColumns(new Set(orderColumns.map((c) => c.uid)));
    //   }
    // };

    // updateVisibleColumns();
    // window.addEventListener('resize', updateVisibleColumns);
    // return () => window.removeEventListener('resize', updateVisibleColumns);
  }, [ordersInTable]);

  const addOrder = (order: OrderInTable) => {
    const newOrder = { ...order, isEnabled: true };
    setOrdersInTable((prevOrders) => {
      const isOrderInTable = prevOrders.some(o => o.description === order.description);
      if (!isOrderInTable) {
        return [...prevOrders, newOrder];
      }
      return prevOrders;
    });

    setNewOrders((prevNewOrders) => [...prevNewOrders, newOrder]);
  };

  const deleteOrder = (orderName: string) => {
    setOrdersInTable((prevOrders) => {
      const updatedOrders = prevOrders.map(order =>
        order.description === orderName ? { ...order, isEnabled: false } : order
      );

      const deletedOrder = prevOrders.find(order => order.description === orderName);

      if (deletedOrder && deletedOrder.id) {
        setDeletedOrders((prevDeleted) =>
          prevDeleted ? [...prevDeleted, deletedOrder.id!] : [deletedOrder.id!]
        );
      } else {
        setNewOrders((prevNewOrders) =>
          prevNewOrders.filter(order => order.description !== orderName)
        );
      }

      return updatedOrders;
    });
  };

  const editOrder = (orderName: string, updatedOrder: Partial<OrderInTable>) => {
    setOrdersInTable((prevOrders) => {
      const updatedOrders = prevOrders.map(order =>
        order.description === orderName ? { ...order, ...updatedOrder } : order
      );

      const orderToUpdate = updatedOrders.find(order => order.description === orderName);

      if (orderToUpdate && orderToUpdate?.id) {
        setUpdatedOrders((prevUpdated) => {
          const isAlreadyUpdated = prevUpdated.some(order => order.id === orderToUpdate.id);
          if (!isAlreadyUpdated) {
            return [...prevUpdated, orderToUpdate];
          } else {
            return prevUpdated.map(order =>
              order.id === orderToUpdate.id ? orderToUpdate : order
            );
          }
        });
      } else {
        setNewOrders((prevNewOrders) => {
          const updatedNewOrders = [...prevNewOrders];
          const newOrderIndex = updatedNewOrders.findIndex(order => order.description === orderName);
          if (newOrderIndex !== -1) {
            updatedNewOrders[newOrderIndex] = { ...updatedNewOrders[newOrderIndex], ...updatedOrder };
          }
          return updatedNewOrders;
        });
      }

      return updatedOrders;
    });
  };

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return orderColumns;
    return orderColumns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredOrders = [...(ordersInTable || [])];

    if (hasSearchFilter) {
      filteredOrders = filteredOrders.filter((order) =>
        order.description.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredOrders;
  }, [ordersInTable, filterValue]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof OrderInTable];
      const second = b[sortDescriptor.column as keyof OrderInTable];
      const cmp = first !== null && first !== undefined && second !== null && second !== undefined
        ? first < second ? -1 : first > second ? 1 : 0
        : 0;
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue('');
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue('');
    setPage(1);
  }, []);

  const renderCell = React.useCallback((order: OrderInTable, columnKey: React.Key) => {
    const cellValue = order[columnKey as keyof OrderInTable];
    switch (columnKey) {
      case 'description':
        return (
          <div>
            <p className="text-bold">{order.description}</p>
          </div>
        );
      case 'unit':
        return (
          <Autocomplete
            label="Select Unit"
            className="mt-4 md:max-w-72"
            variant="underlined"
            value={order.unit}
            selectedKey={order.unit}
            isRequired
            inputProps={{
              classNames: {
                base: 'bg-white',
                inputWrapper:
                  "px-1 bg-white shadow-none border-b-3 border-light-200 rounded-none after:content-[''] after:w-0 after:origin-center after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-[2px] after:h-[2px] data-[open=true]:after:w-full data-[focus=true]:after:w-full after:bg-light-900 after:transition-width motion-reduce:after:transition-none",
                label: 'text-light-300 dark:text-secondary-400 text-small',
                input: 'text-secondary-950 dark:text-white',
              },
            }}
            onSelectionChange={(value) => editOrder(order.description, { unit: value as UnitType})}
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
        );
      case 'unitPrice':
        return (
          <Input
            type="number"
            value={order.unitPrice?.toString() ?? '0'}
            placeholder="Set Price"
            isRequired={true}
            variant="underlined"
            onChange={(e) => {
              const newPrice = parseInt(e.target.value);
              const { error } = orderSchema.validate({ unitPrice: newPrice, quantity: order.quantity });

              if (error) {
                console.error(error.message);
                toast.error(error.message);
              } else {
                editOrder(order.description, { unitPrice: newPrice });
              }
            }}
          />
        );
      case 'quantity':
        return (
          <Input
            type="number"
            value={order.quantity?.toString() ?? '1'}
            placeholder="Set Quantity"
            isRequired={true}
            variant="underlined"
            onChange={(e) => {
              const newQuantity = parseInt(e.target.value);
              const { error } = orderSchema.validate({ quantity: newQuantity, unitPrice: order.unitPrice });

              if (error) {
                console.error(error.message);
                toast.error(error.message);
              } else {
                editOrder(order.description, { quantity: newQuantity });
              }
            }}
          />
        );
      case 'total':
        return (
          <div>
            ${order.quantity && order.unitPrice ? order.quantity * order.unitPrice : 0}
          </div>
        );
      case 'action':
        if (order.isEnabled) {
          return (
            <Button
              color="danger"
              radius="sm"
              variant="solid"
              onClick={() => deleteOrder(order.description)}
              isIconOnly
              size="sm"
            >
              <Trash2 size={22} />
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
                    o.description === order.description ? { ...o, isEnabled: true} : o
                  )
                )
                addOrder(order)
              }}
              isIconOnly
              size="sm"
            >
              <PlusIcon size={22} />
            </Button>
          );
        }
      default:
        return cellValue;
    }
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            type="text"
            placeholder="Search by Name"
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
                {orderColumns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {column.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">
            Total {ordersInTable.length} orders
          </span>
        </div>
      </div>
    );
  }, [filterValue, visibleColumns, ordersInTable.length, onSearchChange]);

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
    );
  }, [items.length, page, pages, hasSearchFilter]);

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
                align={column.uid === 'action' ? 'center' : 'start'}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent="No orders found" items={sortedItems}>
            {(item) => (
              <TableRow key={item.description}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const CakeTable = (props: cakeTableProps) => {
  const cakesApi = new CakesApi()

  const { data: cakes, isLoading } = useQuery<ApiResponse<Cake[]>, ServerError>({
    queryKey: ['cakes'],
    queryFn: async () => await cakesApi.getCakes(),
    refetchInterval: 5000
  })
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

  const [cakesInTable, setCakesInTable] = React.useState<CakeInTable[]>([])
  const [newCakes, setNewCakes] = React.useState<CakeInTable[]>([])
  const [updatedCakes, setUpdatedCakes] = React.useState<CakeInTable[]>([])
  const [deletedCakes, setDeletedCakes] = React.useState<number[] | undefined>([])

  const hasSearchFilter = Boolean(filterValue)

  useEffect(() => {
    if (cakes?.payload) {
      const cakeInTableArray: CakeInTable[] = cakes.payload
        .filter(cake => cake.eventId === props.id) // Filter by eventId
        .map(cake => ({
          id: cake.id,
          type: cake.type,
          description: cake.description,
          unitPrice: cake.unitPrice,
          quantity: cake.quantity,
          total: cake.unitPrice * cake.quantity,
          isEnabled: true,
        }));
        console.log(cakeInTableArray)
      setCakesInTable(cakeInTableArray);

      setCakesInTable(prevCakes => {
        const updatedCakes = [...prevCakes];

        Object.values(CakeDescription).forEach(type => {
          let currentCake = prevCakes.find(cake => cake.description === type);
          if (!currentCake) {
            const newCake = {
              description: type,
              unitPrice: 0,
              quantity: 1,
              isEnabled: false,
              type: ''
            }
            updatedCakes.push(newCake);
          }
        })

        return updatedCakes
      })
    }
  }, [cakes, props.id]);

  useEffect(() => {
    props.update({newCakes, updatedCakes, deletedCakes})
    // const updateVisibleColumns = () => {
    //   if (window.innerWidth <= 1024) {
    //     setVisibleColumns(new Set(['type', 'price']))
    //   } else {
    //     setVisibleColumns(new Set(cakeColumns.map((c) => c.uid)))
    //   }
    // }

    // updateVisibleColumns()
    // window.addEventListener('resize', updateVisibleColumns)
    // return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [cakesInTable])

  const addCake =  (cake: CakeInTable) => {
    const newCake = { ...cake, isEnabled: true };
    setCakesInTable((prevCakes) => {
      const isCakeInTable = prevCakes.some(c => c.description === cake.description);
      if (!isCakeInTable) {
        return [...prevCakes, newCake];
      }
      return prevCakes;
    })

    setNewCakes(prevNewCakes => [...prevNewCakes, newCake])
  }

  // Function to delete an activity by name
  const deleteCake = (cakeName: string) => {
    setCakesInTable(prevCakes => {
      console.log(prevCakes)
      const updatedCakes = prevCakes.map(cake => 
        cake.description === cakeName ? { ...cake, isEnabled: false } : cake
      );
  
      // Check if the activity is in newActivities
      const deletedCake = prevCakes.find(cake => cake.description === cakeName);
  
      if (deletedCake && deletedCake.id) {
        setDeletedCakes(prevDeleted => prevDeleted ? [...prevDeleted, deletedCake.id!] : [deletedCake.id!])
      } else {
        setNewCakes((prevNewCakes) =>
          prevNewCakes.filter(cake => cake.description !== cakeName)
        )
      }
  
      return updatedCakes;
    });
  };

// Function to edit an activity by name
const editCake = (cakeName: string, updatedCake: Partial<CakeInTable>) => {
  setCakesInTable(prevCakes => {
    const updatedCakes = prevCakes.map(cake => 
      cake.description === cakeName ? { ...cake, ...updatedCake } :  cake
    );

    const cakeToUpdate = updatedCakes.find(cake => cake.description === cakeName);

    if (cakeToUpdate && cakeToUpdate?.id) {
      setUpdatedCakes((prevUpdated) => {
        const isAlreadyUpdated = prevUpdated.some(cake => cake.id === cakeToUpdate.id);
        if (!isAlreadyUpdated) {
          return [...prevUpdated, cakeToUpdate];
        } else {
          return prevUpdated.map(cake =>
            cake.id === cakeToUpdate.id ? cakeToUpdate : cake
          );
        }
      });
    } else {
      setNewCakes((prevNewCakes) => {
        const updatedNewCakes = [...prevNewCakes];
        const newCakeIndex = updatedNewCakes.findIndex(cake => cake.description === cakeName);
        if (newCakeIndex !== -1) {
          updatedNewCakes[newCakeIndex] = { ...updatedNewCakes[newCakeIndex], ...updatedCake };
        }
        return updatedNewCakes;
      })
    }

    return updatedCakes

    
  });
};

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
    const cellValue = cake[columnKey as keyof CakeInTable];
    switch (columnKey) {
      case 'description':
        return (
          <div>
            <p className="text-bold break-words max-w-[255px]">{cake.description}</p>
          </div>
        );
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
                  } else {
                    editCake(cake.description, { type: newType})
                  }
                }}
              />
        )
      case 'unitPrice':
        return (
          <Input
            type="number"
            value={cake.unitPrice?.toString() ?? '0'}
            placeholder="Set Price"
            isRequired={true}
            variant="underlined"
            onChange={(e) => {
              const newPrice = parseInt(e.target.value);
              const { error } = orderSchema.validate({ unitPrice: newPrice, quantity: cake.quantity });

              if (error) {
                console.error(error.message);
                toast.error(error.message);
              } else {
                editCake(cake.description, { unitPrice: newPrice });
              }
            }}
          />
        );
      case 'quantity':
        return (
          <Input
            type="number"
            value={cake.quantity?.toString() ?? '1'}
            placeholder="Set Quantity"
            isRequired={true}
            variant="underlined"
            onChange={(e) => {
              const newQuantity = parseInt(e.target.value);
              const { error } = orderSchema.validate({ quantity: newQuantity, unitPrice: cake.unitPrice });

              if (error) {
                console.error(error.message);
                toast.error(error.message);
              } else {
                editCake(cake.description, { quantity: newQuantity });
              }
            }}
          />
        );
      case 'total':
        return (
          <div>
            ${cake.quantity && cake.unitPrice ? cake.quantity * cake.unitPrice : 0}
          </div>
        );
      case 'action':
        if (cake.isEnabled) {
          return (
            <Button
              color="danger"
              radius="sm"
              variant="solid"
              onClick={() => deleteCake(cake.description)}
              isIconOnly
              size="sm"
            >
              <Trash2 size={22} />
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
                    c.description === cake.description ? { ...c, isEnabled: true} : c
                  )
                )
                addCake(cake)
              }}
              isIconOnly
              size="sm"
            >
              <PlusIcon size={22} />
            </Button>
          );
        }
      default:
        return cellValue;
    }
  }, []);

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
                {cakeColumns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {toCapitalCase(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
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
  const extrasApi = new ExtrasApi()

  const { data: extras, isLoading } = useQuery<ApiResponse<Extra[]>, ServerError>({
    queryKey: ['extras'],
    queryFn: async () => await extrasApi.getExtras(),
    refetchInterval: 5000
  })
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

  const [extrasInTable, setExtrasInTable] = React.useState<ExtraInTable[]>([])
  const [newExtras, setNewExtras] = React.useState<ExtraInTable[]>([])
  const [updatedExtras, setUpdatedExtras] = React.useState<ExtraInTable[]>([])
  const [deletedExtras, setDeletedExtras] = React.useState<number[] | undefined>([])

  const hasSearchFilter = Boolean(filterValue)

  useEffect(() => {
    if (extras?.payload) {
      const extraInTableArray: ExtraInTable[] = extras.payload
        .filter(extra => extra.eventId === props.id) // Filter by eventId
        .map(extra => ({
          id: extra.id,
          description: extra.description,
          unitPrice: extra.unitPrice,
          quantity: extra.quantity,
          total: (extra.unitPrice * extra.quantity),
          isEnabled: true
        }));
        console.log(extraInTableArray)
      setExtrasInTable(extraInTableArray);

      setExtrasInTable(prevExtras => {
        const updatedExtras = [...prevExtras];

        Object.values(ExtraType).forEach(type => {
          let currentExtra = prevExtras.find(extra => extra.description === type);
          if (!currentExtra) {
            const newExtra = {
              description: type,
              unitPrice: 0,
              quantity: 1,
              isEnabled: false,
            }
            updatedExtras.push(newExtra);
          }
        });

        return updatedExtras;
      })
    }
  }, [extras, props.id]);

  useEffect(() => {
    props.update({newExtras, updatedExtras, deletedExtras})
    // const updateVisibleColumns = () => {
    //   if (window.innerWidth <= 1024) {
    //     setVisibleColumns(new Set(['description', 'unitPrice']))
    //   } else {
    //     setVisibleColumns(new Set(extraColumns.map((c) => c.uid)))
    //   }
    // }

    // updateVisibleColumns()
    // window.addEventListener('resize', updateVisibleColumns)
    // return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [extrasInTable])

  const addExtra =  (extra: ExtraInTable) => {
    const newExtra = { ...extra, isEnabled: true };
    setExtrasInTable(prevExtras => {
      const isExtraInTable = prevExtras.some(e => e.description === extra.description);
      if (!isExtraInTable) {
        return [...extrasInTable, extra]
      }
      return prevExtras
    });

    setNewExtras(prevNewExtras => [...prevNewExtras, newExtra])
  }

  // Function to delete an extra by name
  const deleteExtra = (extraName: string) => {
    setExtrasInTable(prevExtras => {
      console.log(prevExtras)
      const updatedExtras = prevExtras.map(extra => 
        extra.description !== extraName ? { ...extra, isEnabled: false } : extra
      );

      const deletedExtra = prevExtras.find(extra => extra.description === extraName);

      if (deletedExtra && deletedExtra.id) {
        setDeletedExtras((prevDeleted) =>
          prevDeleted ? [...prevDeleted, deletedExtra.id!] : [deletedExtra.id!]
        );
      } else {
        setNewExtras((prevNewExtras) =>
          prevNewExtras.filter(extra => extra.description !== extraName)
        );
      }
      
      return updatedExtras
    });
  };

// Function to edit an extra by name
const editExtra = (extraName: string, updatedExtra: Partial<ExtraInTable>) => {
  setExtrasInTable(prevExtras => {
    const updatedExtras = prevExtras.map(extra =>
      extra.description === extraName ? { ...extra, ...updatedExtra } : extra
    );

    const extraToUpdate = updatedExtras.find(extra => extra.description === extraName);

    if (extraToUpdate && extraToUpdate.id) {
      setUpdatedExtras((prevUpdated) => {
        const isAlreadyUpdated = prevUpdated.some(extra => extra.id === extraToUpdate.id);
        if (!isAlreadyUpdated) {
          return [...prevUpdated, extraToUpdate]
        } else {
          return prevUpdated.map(extra =>
            extra.id === extraToUpdate.id ? extraToUpdate : extra
          );
        }
      });
    } else {
      setNewExtras((prevNewExtras) => {
        const updatedNewExtras = [...prevNewExtras];
        const newExtraIndex = updatedNewExtras.findIndex(extra => extra.description === extraName);
        if (newExtraIndex !== -1) {
          updatedNewExtras[newExtraIndex] = { ...updatedNewExtras[newExtraIndex], ...updatedExtra };
        }
        return updatedNewExtras;
      });
    }

    return updatedExtras;
  });
};

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
                } else {
                  editExtra(extra.description, { unitPrice: newPrice });
                }
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
              } else {
                editExtra(extra.description, { quantity: newQuantity });
              }
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
                onClick={() => deleteExtra(extra.description)}
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
                {extraColumns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {toCapitalCase(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
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
    <div
      className={`mt-10 flex w-full flex-col items-start justify-start p-3 md:p-8 md:py-16 lg:flex-row lg:items-center`}
    >
      {/* Left Part */}
      <div className={`flex w-full flex-col md:w-[350px]`}>
        <h3 className="text-secondary-950 text-base dark:text-secondary-50">{title}</h3>
        <p className="mt-0.5 text-wrap text-small text-light-300 md:w-[90%]">{description}</p>
      </div>
      {/* Right Part */}
      <div className={horizontalScroll ? "w-full overflow-x-auto" : undefined}>
        {form}
      </div>
    </div>
  )
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { getEvent, editEvent } = useEvents()
  const [event, setEvent] = useState<Event | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(true)
  const [activities, setAcitivities] = React.useState<ActivityToSend>({newActivities: [], updatedActivities: [], deletedActivities: []})
  const [orders, setOrders] = React.useState<OrderToSend>({newOrders: [], updatedOrders: [], deletedOrders: []})
  const [cakes, setCakes] = React.useState<CakeToSend>({newCakes: [], updatedCakes: [], deletedCakes: []})
  const [extras, setExtras] = React.useState<ExtraToSend>({newExtras: [], updatedExtras: [], deletedExtras: []})

  const router = useRouter()
  const { id } = params

  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: joiResolver(editEventSchema),
  })

  useEffect(() => {
    const fetchEvent = async () => {
      const eventData = await getEvent(Number(id))
      setEvent(eventData)
      if (eventData) {
        setValue('clientName', eventData?.client?.name || '')
        setValue(
          'clientBirthday',
          eventData?.client?.birthdate
            ? parseDate(eventData.client.birthdate.split('T')[0])
            : undefined
        )
        setValue('clientAddress', eventData?.client?.address || '')
        setValue('clientEmail', eventData?.client?.email || '')
        setValue('clientMobile', eventData?.client?.phone || '')
        setValue('contactName', eventData?.client?.contactname || '')
        setValue('school', eventData?.client?.school || '')
        setValue('title', eventData.title)
        setValue('category', eventData.category)
        setValue('location',eventData.location)
        setValue('price', eventData.price)
        setValue('extraKidPrice', eventData.extraKidPrice)
        setValue('minimumCharge', eventData.minimumCharge)
        setValue('deposit', eventData.deposit)
        setValue('description', eventData.description)
        setValue('dateRange', {
          start: parseDate(eventData.startDate.split('T')[0]),
          end: parseDate(eventData.endDate.split('T')[0]),
        })
        setValue('startTime', parseTimeFromISO(eventData.startDate))
        setValue('endTime', parseTimeFromISO(eventData.endDate))
        setValue('ageGroup', eventData.ageGroup)
        setValue('numberOfAttendees', eventData.numberOfAttendees)
        setValue('extraNote', eventData.extraNote)
      }
      setLoading(false)
    }
    fetchEvent()
  }, [id, getEvent, setValue])

  if (!event) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const removeActionProperty = (array: Array<any>) => {
    return array.map(({ action, isEnabled, ...rest }) => rest);
  };

  const removeTotalProperty = (array: Array<any>) => {
    return array.map(({total, ...rest}) => rest);
  }

  const update = (activities: ActivityToSend) => {
    console.log(activities)
    setAcitivities(activities)
  }

  const updateOrder = (orders: OrderToSend) => {
    console.log(orders);
    setOrders(orders);
  }

  const updateCake = (cakes: CakeToSend) => {
    console.log(cakes);
    setCakes(cakes);
  }

  const updateExtra = (extras: ExtraToSend) => {
    console.log(extras);
    setExtras(extras);
  }

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

    if (data.deposit > data.price) {
      setError('deposit', { message: 'Deposit cannot be more than the price' })
      toast.error('Deposit cannot be more than the price')
      return
    }

    if (data.clientBirthday && new Date(data.clientBirthday.toString()) > new Date()) {
      setError('clientBirthday', { message: 'Birthday cannot be in the future' })
      toast.error('Birthday cannot be in the future')
      return
    }

    let newOrders = removeActionProperty(orders.newOrders);
    newOrders = removeTotalProperty(newOrders);

    let updatedOrders = removeActionProperty(orders.updatedOrders);
    updatedOrders = removeTotalProperty(updatedOrders);

    let newCakes = removeActionProperty(cakes.newCakes);
    newCakes = removeTotalProperty(newCakes);

    let updatedCakes = removeActionProperty(cakes.updatedCakes);
    updatedCakes = removeTotalProperty(updatedCakes);

    let newExtras = removeActionProperty(extras.newExtras);
    newExtras = removeTotalProperty(newExtras);

    let updatedExtras = removeActionProperty(extras.updatedExtras);
    updatedExtras = removeTotalProperty(updatedExtras);

    try {
      const activitiesToSend = {
        newActivities: removeActionProperty(activities.newActivities),
        updatedActivities: removeActionProperty(activities.updatedActivities),
        deletedActivities: activities.deletedActivities,
      };
      const ordersToSend = {
        newOrders: newOrders,
        updatedOrders: updatedOrders,
        deletedOrders: orders.deletedOrders
      }
      const cakesToSend = {
        newCakes: newCakes,
        updatedCakes: updatedCakes,
        deletedCakes: cakes.deletedCakes
      }
      const extrasToSend = {
        newExtras: newExtras,
        updatedExtras: updatedExtras,
        deletedExtras: extras.deletedExtras
      }
      const updatedEvent = {
        title: data.title,
        category: data.category,
        location: data.location,
        price: data.price,
        extraKidPrice: data.extraKidPrice,
        minimumCharge: data.minimumCharge,
        deposit: data.deposit,
        description: data.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        remaining: (data.price + data.extraKidPrice) - data.deposit,
        client: {
          id: event.client?.id,
          name: data.clientName,
          email: data.clientEmail,
          phone: data.clientMobile,
          address: data.clientAddress,
          birthdate: data.clientBirthday ? `${data.clientBirthday.toString()}T00:00:00Z` : null,
          contactname: data.contactName,
          school: data.school,
        },
        ageGroup: data.ageGroup,
        numberOfAttendees: data.numberOfAttendees,
        extraNote: data.extraNote,
      }

      await editEvent(Number(id), updatedEvent, activitiesToSend, ordersToSend, cakesToSend, extrasToSend)
      router.push('/events')
      toast.success(`Event ${data.title} updated successfully.`)
      reset()
    } catch (error) {
      toast.error('Failed to update event')
      if (error instanceof Error) {
        setError('root', { message: error.message })
      }
    }
  }

  const toDateValue = (date: Date) => parseDate(date.toISOString().split('T')[0])

  return (
    <div className="flex h-full w-full flex-grow flex-col items-start text-light-400">
      <div className="px-3 py-4 md:px-10 md:py-8">
        <h1 className="text-2xl font-bold">Edit Event</h1>
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
        {/* Third section contains event dateRange, event start time and event end time */}
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
        {/* this section contains Amount Due, Deposit, and extra note (textarea) */}
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
                variant="underlined"
                className="mt-4 md:max-w-72"
                {...register('extraNote')}
                isInvalid={!!errors.extraNote}
                errorMessage={errors.extraNote?.message}
                readOnly={isSubmitting}
              />
              <Input
                isRequired
                type="number"
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
          horizontalScroll={true}
          title='Activity Information'
          description='Enter the activity information'
          form={<ActivityTable update={update} id={Number(params.id)}/>}
          />
          <Spacer y={2} />
          <Divider className="bg-light-200" />
          <Section 
            horizontalScroll={true}
          title='Order Information' 
          description='Enter the event orders'
          form={<OrderTable update={updateOrder} id={Number(params.id)}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          horizontalScroll={true}
          title='Cake Information' 
          description='Enter the event cakes'
          form={<CakeTable update={updateCake} id={Number(params.id)}/>}
        />
        <Spacer y={2} />
        <Divider className="bg-light-200" />
        <Section 
          horizontalScroll={true}
          title='Extra Decorations and Themes Information' 
          description='Enter the event extras'
          form={<ExtraTable update={updateExtra} id={Number(params.id)}/>}
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
            Update Event
          </Button>
        </div>
      </form>
    </div>
  )
}
