'use client'
import React, { useEffect, useState } from 'react'
import { useEvents } from '../../contexts/EventContext'
import { Event, EventCategory } from '@/api/models/Event.model'
import { toCapitalCase } from '@/utils/string'
import { jsPDF } from 'jspdf'
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
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
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Selection,
  Skeleton,
  SortDescriptor,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  User,
} from '@nextui-org/react'
import { ChevronDownIcon, Coins, DoorClosed, Edit, Plus, PrinterIcon, Search } from 'lucide-react'
import { zonedFormatDate } from '@/utils/date'
import Link from 'next/link'
import { joiResolver } from '@hookform/resolvers/joi'
import { useForm, FieldValues } from 'react-hook-form'
import Joi, { CustomHelpers } from 'joi'
import toast from 'react-hot-toast'
import { ActivitiesApi } from '@/api/activity.api'
import { useQuery } from '@tanstack/react-query'
import { ApiResponse, ServerError } from '@/api/utils'
import { Activity, ActivityType } from '@/api/models/Activity.model'
import { OrdersApi } from '@/api/order.api'
import { Order, OrderType, UnitType } from '@/api/models/Order.model'
import { CakesApi } from '@/api/cake.api'
import { Cake, CakeDescription } from '@/api/models/Cake.model'
import { ExtrasApi } from '@/api/extra.api'
import { Extra, ExtraType } from '@/api/models/Extra.model'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const INITIAL_VISIBLE_COLUMNS = ['description', 'price']

const INITIAL_ORDERS_VISIBLE_COLUMNS = ['description', 'unit', 'unitPrice', 'quantity', 'total']

const INITIAL_CAKES_VISIBLE_COLUMNS = [
  'description',
  'type',
  'unitPrice',
  'quantity',
  'total',
  'action',
]

const INITIAL_EXTRAS_VISIBLE_COLUMNS = ['description', 'unitPrice', 'quantity', 'total']

const columns = [
  { name: 'Description', uid: 'description', sortable: true },
  { name: 'Price', uid: 'price', sortable: true },
]

const orderColumns = [
  { name: 'Description', uid: 'description', sortable: true },
  { name: 'Unit', uid: 'unit', sortable: true },
  { name: 'Unit Price', uid: 'unitPrice', sortable: true },
  { name: 'Quantity', uid: 'quantity', sortable: true },
  { name: 'Total', uid: 'total', sortable: true },
]

const cakeColumns = [
  { name: 'Description', uid: 'description', sortable: true },
  { name: 'Type', uid: 'type', sortable: true },
  { name: 'Unit Price', uid: 'unitPrice', sortable: true },
  { name: 'Quantity', uid: 'quantity', sortable: true },
  { name: 'Total', uid: 'total', sortable: true },
  { name: 'Actions', uid: 'action', sortable: false },
]

const extraColumns = [
  { name: 'Description', uid: 'description', sortable: true },
  { name: 'Unit Price', uid: 'unitPrice', sortable: true },
  { name: 'Quantity', uid: 'quantity', sortable: true },
  { name: 'Total', uid: 'total', sortable: true },
]

type Props = {
  params: {
    id: string
  }
}

type TableProps = {
  params: {
    id: string
  }
  update?: Function
}

export interface ActivityInTable {
  description: ActivityType
  price: number
}

export interface OrderInTable {
  description: OrderType
  unit: UnitType
  unitPrice: number
  quantity: number
  total?: number
}

export interface CakeInTable {
  type: string
  description: CakeDescription
  unitPrice: number
  quantity: number
  total?: number
}

export type ExtraInTable = {
  description: ExtraType
  unitPrice: number
  quantity: number
  total?: number
}

export type PdfProps = {
  event: Event | undefined
  activitiesInTable: ActivityInTable[]
  ordersInTable: OrderInTable[]
  cakesInTable: CakeInTable[]
  extrasInTable: ExtraInTable[]
  total: {
    activityTotal: number
    orderTotal: number
    cakeTotal: number
    extraTotal: number
    eventTotal: number
    paidAmount: number
  }
}

const ActivityTable = (props: TableProps) => {
  const activitiesApi = new ActivitiesApi()

  const { data: activities, isLoading } = useQuery<ApiResponse<Activity[]>, ServerError>({
    queryKey: ['activities'],
    queryFn: async () => await activitiesApi.getActivities(),
    refetchInterval: 5000,
  })

  const [filterValue, setFilterValue] = React.useState('')
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(17)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [activitiesInTable, setActivitiesInTable] = React.useState<ActivityInTable[]>([])

  const hasSearchFilter = Boolean(filterValue)

  useEffect(() => {
    console.log(activities?.payload)
    const filterActivities = async () => {
      const foundActivity = activities?.payload.filter(
        (activity) => activity.eventId === Number(props.params.id)
      )

      if (foundActivity && foundActivity.length > 0) {
        // Check for existence before accessing elements
        const filteredActivities: ActivityInTable[] = foundActivity.map((activity) => ({
          description: activity.description,
          price: activity.price,
        }))

        let totalPrice = filteredActivities.reduce((sum, activity) => sum + activity.price, 0)

        if (props.update) {
          props.update(totalPrice, filteredActivities)
        }

        setActivitiesInTable(filteredActivities)
      }
    }

    // const updateVisibleColumns = () => {
    //   if (window.innerWidth <= 1024) {
    //     setVisibleColumns(new Set(['description', 'price']))
    //   } else {
    //     setVisibleColumns(new Set(columns.map((c) => c.uid)))
    //   }
    // }

    // updateVisibleColumns()
    filterActivities()
    // window.addEventListener('resize', updateVisibleColumns)
    // return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [activities, props.params.id])

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
      const cmp =
        first !== null && first !== undefined && second !== null && second !== undefined
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
        return <div>${activity.price}</div>
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
              <option value="5">5</option>
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
    hasSearchFilter,
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

const OrderTable = (props: TableProps) => {
  const ordersApi = new OrdersApi()

  const { data: orders, isLoading } = useQuery<ApiResponse<Order[]>, ServerError>({
    queryKey: ['orders'],
    queryFn: async () => await ordersApi.getOrders(),
  })

  const [filterValue, setFilterValue] = React.useState('')
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_ORDERS_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(47)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'description',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [ordersInTable, setOrdersInTable] = React.useState<OrderInTable[]>([])

  const hasSearchFilter = Boolean(filterValue)

  useEffect(() => {
    console.log(orders?.payload)
    const filterOrders = async () => {
      let foundOrder = orders?.payload.filter((order) => order.eventId === Number(props.params.id))

      if (foundOrder && foundOrder.length > 0) {
        const filteredOrder: OrderInTable[] = foundOrder.map((order) => ({
          unit: order.unit,
          description: order.description,
          unitPrice: order.unitPrice,
          quantity: order.quantity,
          total: order.unitPrice * order.quantity,
        }))

        let totalPrice = filteredOrder.reduce((sum, order) => sum + order.total!, 0)

        if (props.update) {
          props.update(totalPrice, filteredOrder)
        }

        setOrdersInTable(filteredOrder)
      }
    }

    const updateVisibleColumns = () => {
      if (window.innerWidth <= 1024) {
        setVisibleColumns(new Set(['description', 'quantity', 'total']))
      } else {
        setVisibleColumns(new Set(orderColumns.map((c) => c.uid)))
      }
    }

    updateVisibleColumns()
    filterOrders()
    window.addEventListener('resize', updateVisibleColumns)
    return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [orders, props.params.id])

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
      const cmp =
        first !== null && first !== undefined && second !== null && second !== undefined
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
        return <div>${order.unitPrice}</div>
      case 'total':
        return <div>${order.total}</div>
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
                {orderColumns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {toCapitalCase(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">Total {ordersInTable?.length} orders</span>
          {/* <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent rounded-md text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
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
    hasSearchFilter,
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

const CakeTable = (props: TableProps) => {
  const cakesApi = new CakesApi()

  const { data: cakes, isLoading } = useQuery<ApiResponse<Cake[]>, ServerError>({
    queryKey: ['cakes'],
    queryFn: async () => await cakesApi.getCakes(),
  })

  const [filterValue, setFilterValue] = React.useState('')
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_CAKES_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(3)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'description',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [cakesInTable, setCakesInTable] = React.useState<CakeInTable[]>([])

  const hasSearchFilter = Boolean(filterValue)

  useEffect(() => {
    console.log(cakes?.payload)
    const filterCakes = async () => {
      let foundCake = cakes?.payload.filter((cake) => cake.eventId === Number(props.params.id))

      if (foundCake && foundCake.length > 0) {
        const filteredCake: CakeInTable[] = foundCake.map((cake) => ({
          type: cake.type,
          description: cake.description,
          unitPrice: cake.unitPrice,
          quantity: cake.quantity,
          total: cake.unitPrice * cake.quantity,
        }))

        let totalPrice = filteredCake.reduce((sum, cake) => sum + cake.total!, 0)

        if (props.update) {
          props.update(totalPrice, filteredCake)
        }

        setCakesInTable(filteredCake)
      }
    }

    const updateVisibleColumns = () => {
      if (window.innerWidth <= 1024) {
        setVisibleColumns(new Set(['description', 'type', 'quantity', 'total']))
      } else {
        setVisibleColumns(new Set(cakeColumns.map((c) => c.uid)))
      }
    }

    updateVisibleColumns()
    filterCakes()
    window.addEventListener('resize', updateVisibleColumns)
    return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [cakes, props.params.id])

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
      const cmp =
        first !== null && first !== undefined && second !== null && second !== undefined
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
            <p className="text-bold">{cake.description}</p>
          </div>
        )
      case 'unitPrice':
        return <div>${cake.unitPrice}</div>
      case 'total':
        return <div>${cake.total}</div>
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
          <span className="text-small text-default-400">Total {cakesInTable?.length} cakes</span>
          {/* <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent rounded-md text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
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
    hasSearchFilter,
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

const ExtraTable = (props: TableProps) => {
  const extrasApi = new ExtrasApi()

  const { data: extras, isLoading } = useQuery<ApiResponse<Extra[]>, ServerError>({
    queryKey: ['extras'],
    queryFn: async () => await extrasApi.getExtras(),
  })

  const [filterValue, setFilterValue] = React.useState('')
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_EXTRAS_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(11)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'description',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const [extrasInTable, setExtrasInTable] = React.useState<ExtraInTable[]>([])

  const hasSearchFilter = Boolean(filterValue)

  useEffect(() => {
    console.log(extras?.payload)
    const filterExtras = async () => {
      let foundExtra = extras?.payload.filter((extra) => extra.eventId === Number(props.params.id))

      if (foundExtra && foundExtra.length > 0) {
        const filteredExtra: ExtraInTable[] = foundExtra.map((extra) => ({
          quantity: extra.quantity,
          description: extra.description,
          unitPrice: extra.unitPrice,
          total: extra.unitPrice * extra.quantity,
        }))

        let totalPrice = filteredExtra.reduce((sum, extra) => sum + extra.total!, 0)

        if (props.update) {
          props.update(totalPrice, filteredExtra)
        }

        setExtrasInTable(filteredExtra)
      }
    }

    const updateVisibleColumns = () => {
      if (window.innerWidth <= 1024) {
        setVisibleColumns(new Set(['description', 'quantity', 'total']))
      } else {
        setVisibleColumns(new Set(extraColumns.map((c) => c.uid)))
      }
    }

    updateVisibleColumns()
    filterExtras()
    window.addEventListener('resize', updateVisibleColumns)
    return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [extras, props.params.id])

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
      const cmp =
        first !== null && first !== undefined && second !== null && second !== undefined
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
        return <div>${extra.unitPrice}</div>
      case 'total':
        return <div>${extra.total}</div>
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
          <span className="text-small text-default-400">Total {extrasInTable?.length} extras</span>
          {/* <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent rounded-md text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
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
    hasSearchFilter,
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

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#f7f7f7',
  },
  section: {
    marginBottom: 25,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2C3E50',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#34495E',
  },
  detail: {
    fontSize: 16,
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontWeight: 600,
    width: 150,
    color: '#7F8C8D',
  },
  totalLabel: {
    fontWeight: 600,
    width: 325,
    color: '#7F8C8D',
  },
  value: {
    flex: 1,
    color: '#34495E',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ECF0F1',
    padding: 10,
    marginBottom: 6,
    borderRadius: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495E',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderColor: '#D5DBDB',
    borderWidth: 1,
  },
  tableCell: {
    flex: 1,
    color: '#2C3E50',
    paddingRight: 5,
    textAlign: 'center',
    fontSize: 12
  },
  footer: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 30,
    color: '#95A5A6',
    borderTopWidth: 1,
    borderTopColor: '#D5DBDB',
    paddingTop: 10,
  },
  signatureText: {
    fontSize: 10,
    marginBottom: 5,
  }
  
});

const EventPDF = (props: PdfProps) => {

  const convertString = (input: string): string => {
    if (input.length === 0) return input; // Handle empty string

    const firstChar = input[0]; // Keep the first character as is
    const restOfString = input.slice(1).toLowerCase().replace(/_/g, ' '); // Convert the rest to lowercase and replace underscores

    return firstChar + restOfString;
}

  return props.event ? (
  <Document>
    {/* First Page - Event Details */}
    <Page size="A4" style={styles.page}>
      <Image src="/logo.png" style={{width: 50, height: 50}}/>
      <Text style={styles.title}>{props.event && props.event.title}</Text>
      <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#34495E', textAlign: 'center'}}>ONCE SIGNED AND APPROVED NO REFUND, NO REDEEM</Text>
      <View style={styles.section}>
        <Text style={styles.subtitle}>Client Information</Text>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.label}>Client Name:</Text>
          <Text style={styles.value}>{props.event?.client?.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{props.event?.client?.phone}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{props.event?.client?.email}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{convertString(props.event?.location)}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{convertString(props.event?.category)}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.label}>Dates:</Text>
          <Text style={styles.value}>
            {zonedFormatDate(props.event?.startDate)} - {zonedFormatDate(props.event?.endDate)}
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.subtitle}>Financial Summary</Text>
        <View style={styles.detail}>
          <Text style={styles.label}>Event Price:</Text>
          <Text style={styles.value}>${props.event?.price}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Extra Kid Charge:</Text>
          <Text style={styles.value}>${props.event?.extraKidPrice}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Deposit:</Text>
          <Text style={styles.value}>${props.event?.deposit}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Paid Amount:</Text>
          <Text style={styles.value}>${props.event?.paidAmount}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Remaining:</Text>
          <Text style={styles.value}>${props.event?.remaining}</Text>
        </View>
      </View>
    </Page>

    {/* Third Page - Activities Table */}
    <Page size="A4" style={styles.page}>
    { props.activitiesInTable.length > 0 && (
      <View style={styles.section} wrap={false}>
        <Text style={styles.subtitle}>Activities</Text>
        <View style={styles.tableHeader} wrap={false}>
          <Text style={styles.tableCell}>Description</Text>
          <Text style={styles.tableCell}>Price</Text>
        </View>
        {props.activitiesInTable.map((activity, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.tableCell}>{convertString(activity.description)}</Text>
            <Text style={styles.tableCell}>${activity.price}</Text>
          </View>
        ))}
      </View>
     )}
     { props.ordersInTable.length > 0 && (
      <View style={styles.section} wrap={false}>
        <Text style={styles.subtitle}>Orders</Text>
        <View style={styles.tableHeader} wrap={false}>
          <Text style={styles.tableCell}>Description</Text>
          <Text style={styles.tableCell}>Unit Price</Text>
          <Text style={styles.tableCell}>Quantity</Text>
          <Text style={styles.tableCell}>Total</Text>
        </View>
        {props.ordersInTable.map((order, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.tableCell}>{convertString(order.description)}</Text>
            <Text style={styles.tableCell}>${order.unitPrice}</Text>
            <Text style={styles.tableCell}>{order.quantity}</Text>
            <Text style={styles.tableCell}>${order.total}</Text>
          </View>
        ))}
      </View> )}
      { props.cakesInTable.length > 0 && (
      <View style={styles.section} wrap={false}>
        <Text style={styles.subtitle}>Cakes</Text>
        <View style={styles.tableHeader} wrap={false}>
          <Text style={styles.tableCell}>Type</Text>
          <Text style={styles.tableCell}>Description</Text>
          <Text style={styles.tableCell}>Unit Price</Text>
          <Text style={styles.tableCell}>Quantity</Text>
          <Text style={styles.tableCell}>Total</Text>
        </View>
        {props.cakesInTable.map((cake, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.tableCell}>{cake.type}</Text>
            <Text style={styles.tableCell}>{convertString(cake.description)}</Text>
            <Text style={styles.tableCell}>${cake.unitPrice}</Text>
            <Text style={styles.tableCell}>{cake.quantity}</Text>
            <Text style={styles.tableCell}>${cake.total}</Text>
          </View>
        ))}
      </View> )}
      { props.extrasInTable.length > 0 && (
    <View style={styles.section} wrap={false}>
        <Text style={styles.subtitle}>Extras</Text>
        <View style={styles.tableHeader} wrap={false}>
          <Text style={styles.tableCell}>Description</Text>
          <Text style={styles.tableCell}>Quantity</Text>
          <Text style={styles.tableCell}>Unit Price</Text>
          <Text style={styles.tableCell}>Total</Text>
        </View>
        {props.extrasInTable.map((extra, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.tableCell}>{convertString(extra.description)}</Text>
            <Text style={styles.tableCell}>{extra.quantity}</Text>
            <Text style={styles.tableCell}>${extra.unitPrice}</Text>
            <Text style={styles.tableCell}>${extra.total}</Text>
          </View>
        ))}
      </View> )}
      

      <View style={styles.section} wrap={false}>
        {/* Title */}
      <Text style={styles.subtitle}>Grand Total</Text>
        {/* Activity Total */}
        { props.total.activityTotal > 0 && <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.totalLabel}>Activities Total Price:</Text>
          <Text style={styles.value}>
            ${props.total.activityTotal}
          </Text>
        </View> }

        {/* Orders Total */}
        { props.total.orderTotal > 0 && <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.totalLabel}>Orders Total Price:</Text>
          <Text style={styles.value}>
            ${Number((props.total.orderTotal * 1.11).toFixed(2))}
          </Text>
        </View> }

        {/* Cakes Total */}
        { props.total.cakeTotal > 0 && <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.totalLabel}>Cakes Total Price:</Text>
          <Text style={styles.value}>
            ${props.total.cakeTotal}
          </Text>
        </View> }

        {/* Decorations and Themes Total */}
        { props.total.extraTotal > 0 && <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.totalLabel}>Decorations and Themes Total Price:</Text>
          <Text style={styles.value}>
            ${props.total.extraTotal}
          </Text>
        </View> }

        {/* Event Amount */}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.totalLabel}>Event Amount:</Text>
          <Text style={styles.value}>
            ${props.total.eventTotal}
          </Text>
        </View>

        {/* Paid Amount */}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.totalLabel}>Paid Amount:</Text>
          <Text style={styles.value}>
            ${props.total.paidAmount}
          </Text>
        </View>

        {/* Grand Total */}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.value}>
            ${
                props.total.activityTotal +
                Number((props.total.orderTotal * 1.11).toFixed(2)) +
                props.total.cakeTotal +
                props.total.extraTotal +
                props.total.eventTotal -
                props.total.paidAmount
              }
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 30 }} wrap={false}>
    <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: '#34495E'}}>
      CLIENT SIGNATURE: ONCE SIGNED AND APPROVED NO REFUND, NO REDEEM
    </Text>
    <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 50, color: '#34495E'}}>
      I AGREE ON THE SELECTED ENTERTAINMENTS COST PLUS FOOD QUANTITY & COST CHOSEN BY ME:
    </Text>
    <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: '#34495E'}}>DATE: ____/____/{new Date().getFullYear()}</Text>
  </View>
     </Page>
  </Document>
) : (<Text>Failed to load</Text>)};


const MyPDFButton = (props: PdfProps) => (
  <PDFDownloadLink
    document={
      <EventPDF
        event={props.event}
        activitiesInTable={props.activitiesInTable}
        ordersInTable={props.ordersInTable}
        cakesInTable={props.cakesInTable}
        extrasInTable={props.extrasInTable}
        total={props.total}
      />
    }
    fileName="event-details.pdf"
    className="flex items-center gap-2 rounded-md bg-light-100 p-3"
  >
    <p className="hidden font-semibold lg:block">Print Event Details</p>
    <PrinterIcon size={20} />
  </PDFDownloadLink>
);

const ViewPage = ({ params }: Props) => {
  const { getEvent, editEvent } = useEvents()
  const [event, setEvent] = useState<Event | undefined>(undefined)
  const [price, setPrice] = useState<number>(0)
  const [extraKidPrice, setExtraKidPrice] = useState<number>(0)
  const [deposit, setDeposit] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [remaining, setRemaining] = useState<number>(0)
  const [minimumCharge, setMinimumCharge] = useState<number>(0)
  const [activityTotal, setActivityTotal] = useState<number>(0)
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [cakeTotal, setCakeTotal] = useState<number>(0)
  const [extraTotal, setExtraTotal] = useState<number>(0)
  const [date, setDate] = useState<string>('')
  const [activitiesInTable, setActivitiesInTable] = useState<ActivityInTable[]>([])
  const [ordersInTable, setOrdersInTable] = useState<OrderInTable[]>([])
  const [cakesInTable, setCakesInTable] = useState<CakeInTable[]>([])
  const [extrasInTable, setExtrasInTable] = useState<ExtraInTable[]>([])
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  useEffect(() => {
    const fetchEvent = async () => {
      const eventData = await getEvent(Number(params.id))
      console.log(eventData)
      setEvent(eventData)

      if (eventData) {
        setPrice(eventData.price)
        setExtraKidPrice(eventData.extraKidPrice)
        setDeposit(eventData.deposit)
        setRemaining(eventData.remaining)
        setPaidAmount(eventData.paidAmount)
        setMinimumCharge(eventData.minimumCharge)
        setDate(`${eventData.startDate} - ${eventData.endDate}`)
      }
    }

    fetchEvent()
  }, [params.id, getEvent])

  const updateActivity = (total: number, activities: ActivityInTable[]) => {
    setActivityTotal(total)
    setActivitiesInTable(activities)
  }

  const updateOrder = (total: number, orders: OrderInTable[]) => {
    setOrderTotal(total)
    setOrdersInTable(orders)
  }

  const updateCake = (total: number, cakes: CakeInTable[]) => {
    setCakeTotal(total)
    setCakesInTable(cakes)
  }

  const updateExtra = (total: number, extras: ExtraInTable[]) => {
    setExtraTotal(total)
    setExtrasInTable(extras)
  }

  const category = () => {
    switch (event?.category) {
      case EventCategory.BabyShower:
        return 'Baby Shower'
      case EventCategory.BirthdayParty:
        return 'Birthday Party'
      case EventCategory.Baptism:
        return 'Baptism'
      case EventCategory.Playground:
        return 'Playground'
      case EventCategory.Events:
        return 'Events'
      case EventCategory.Birthday:
        return 'Birthday'
      case EventCategory.Concert:
        return 'Concert'
      case EventCategory.ArtExhibition:
        return 'Art Exhibition'
      case EventCategory.StageShows:
        return 'Stage Shows'
      case EventCategory.GenderReveal:
        return 'Gender Reveal'
      case EventCategory.Communion:
        return 'Communion'
      case EventCategory.ArtisticParades:
        return 'Artistic Parades'
      case EventCategory.SummerCamper:
        return 'Summer Camper'
      case EventCategory.NurseriesVisit:
        return 'Nurseries Visit'
      default:
        return 'Other'
    }
  }

  const location = () => {
    switch (event?.location) {
      case 'INDOOR':
        return 'Indoor'
      case 'OUTDOOR':
        return 'Outdoor'
      default:
        return 'Other'
    }
  }

  const addPaymentSchema = Joi.object({
    price: Joi.number()
      .required()
      .min(0)
      .max(remaining)
      .messages({
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
        remaining: event.price + event.extraKidPrice + event.minimumCharge - newPaidAmount,
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
        {event && event.client ? (
          <div className='flex flex-col gap-5 items-start justify-start'>
            <h1 className="text-3xl font-bold text-light-400">{toCapitalCase(event.title)}</h1>
            <Popover radius="sm">
              <PopoverTrigger className="hover:cursor-pointer">
                <User
                  name={event.client.name}
                  avatarProps={{
                    isBordered: true,
                    size: 'sm',
                  }}
                />
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Card className="max-w-[340px] p-4">
                  <CardHeader className="justify-between">
                    <div className="flex gap-3">
                      <Avatar isBordered radius="full" size="md" />
                      <div className="flex flex-col items-start justify-center gap-1">
                        <h4 className="text-small font-semibold leading-none text-default-600">
                          {event.client.name}
                        </h4>
                        <h5 className="text-small tracking-tight text-default-400">
                          {event.client.phone}
                        </h5>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="px-3 py-0 text-small text-default-400">
                    <p>{event.client.address === '' ? 'No Address' : event.client.address}</p>
                    <span className="pt-2">
                      {event.client.email === '' ? 'No Email' : event.client.email}
                    </span>
                  </CardBody>
                </Card>
              </PopoverContent>
            </Popover>
          </div>
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
          <MyPDFButton event={event} activitiesInTable={activitiesInTable} ordersInTable={ordersInTable} cakesInTable={cakesInTable} extrasInTable={extrasInTable} 
          total={{activityTotal: activityTotal,
                orderTotal: Number((orderTotal * 1.11).toFixed(2)),
                cakeTotal: cakeTotal,
                extraTotal: extraTotal,
                eventTotal: extraKidPrice + price,
                paidAmount: paidAmount}}/>
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

      <h1 className="my-5 text-2xl font-bold">Details</h1>
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
          <p className="text-md text-light-300">Location</p>
          {event ? (
            <p className="text-md text-light-400">{location()}</p>
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
          <p className="text-md text-light-300">Extra Kid Charge</p>
          {event ? (
            <p className="text-md text-light-400">${extraKidPrice}</p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Minimum Charge</p>
          {event ? (
            <p className="text-md text-light-400">${minimumCharge}</p>
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
      <h1 className="my-5 text-2xl font-bold">Activities</h1>
      <ActivityTable params={params} update={updateActivity} />
      <h1 className="my-5 text-2xl font-bold">Orders</h1>
      <OrderTable params={params} update={updateOrder} />
      <h1 className="my-5 text-2xl font-bold">Cakes</h1>
      <CakeTable params={params} update={updateCake} />
      <h1 className="my-5 text-2xl font-bold">Extra Decorations and Themes</h1>
      <ExtraTable params={params} update={updateExtra} />
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
      <h1 className="my-5 text-2xl font-bold">Grand Total</h1>
      <div className="flex flex-col gap-5">
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
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Orders Total Price</p>
          {orderTotal ? (
            <p className="text-md text-light-400">${orderTotal}</p>
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
        <div className="flex items-center justify-between">
          <p className="text-md text-light-300">Decorations and Themes Total Price</p>
          {extraTotal ? (
            <p className="text-md text-light-400">${extraTotal}</p>
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
            <p className="text-md text-light-400">
              $
              {activityTotal +
                orderTotal +
                cakeTotal +
                extraTotal +
                extraKidPrice +
                price -
                paidAmount}
            </p>
          ) : (
            <Skeleton className="w-[25px] rounded-lg">
              <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            </Skeleton>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewPage
