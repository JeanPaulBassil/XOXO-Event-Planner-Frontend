'use client'
import React, { useEffect } from 'react'
import { ClientsApi } from '@/api/clients.api'
import { Client } from '@/api/models/Client.model'
import { ApiResponse, ServerError } from '@/api/utils'
import { toCapitalCase } from '@/utils/string'
import { Input } from '@nextui-org/input'
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon, Delete, Edit, Search, SearchIcon, Trash } from 'lucide-react'
import { Selection, SortDescriptor } from '@react-types/shared'

const INITIAL_VISIBLE_COLUMNS: (keyof Client | 'actions')[] = [
  'name',
  'email',
  'phone',
  'address',
  'birthdate',
  'actions',
]

const columns = [
  { name: 'Id', uid: 'id', sortable: true },
  { name: 'Name', uid: 'name', sortable: true },
  { name: 'Email', uid: 'email', sortable: true },
  { name: 'Phone', uid: 'phone', sortable: true },
  { name: 'Address', uid: 'address', sortable: true },
  { name: 'Birthday', uid: 'birthdate', sortable: true },
  { name: 'Actions', uid: 'actions', sortable: false },
]

const statusColorMap: Record<string, string> = {
  active: 'success',
  paused: 'danger',
  vacation: 'warning',
}

const Page = () => {
  const clientsApi = new ClientsApi()

  const { data: clients, isLoading } = useQuery<ApiResponse<Client[]>, ServerError>({
    queryKey: ['clients'],
    queryFn: async () => await clientsApi.getClients(),
  })

  const [filterValue, setFilterValue] = React.useState('')
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  )
  const [rowsPerPage, setRowsPerPage] = React.useState(5)
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  })

  const [page, setPage] = React.useState(1)

  const hasSearchFilter = Boolean(filterValue)

  useEffect(() => {
    const updateVisibleColumns = () => {
      if (window.innerWidth <= 1024) {
        setVisibleColumns(new Set(['name', 'actions']))
      } else {
        setVisibleColumns(new Set(columns.map((c) => c.uid)))
      }
    }

    updateVisibleColumns()
    window.addEventListener('resize', updateVisibleColumns)
    return () => window.removeEventListener('resize', updateVisibleColumns)
  }, [])

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return columns
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid))
  }, [visibleColumns])

  const filteredItems = React.useMemo(() => {
    let filteredClients = [...(clients?.payload || [])]

    if (hasSearchFilter) {
      filteredClients = filteredClients.filter((client) =>
        client.name.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredClients
  }, [clients, filterValue])

  const pages = Math.ceil(filteredItems.length / rowsPerPage)

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredItems.slice(start, end)
  }, [page, filteredItems, rowsPerPage])

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Client]
      const second = b[sortDescriptor.column as keyof Client]
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

  const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value))
    setPage(1)
  }, [])

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

  const renderCell = React.useCallback((client: Client, columnKey: React.Key) => {
    const cellValue = client[columnKey as keyof Client]
    switch (columnKey) {
      case 'name':
        return (
          <div>
            <p className="text-bold">{client.name}</p>
            <p className="text-small text-default-400">{client.email}</p>
          </div>
        )
      case 'actions':
        return (
          <div className="relative flex items-center justify-end gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <ChevronDownIcon className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem startContent={<Edit size={20} />}>Edit</DropdownItem>
                <DropdownItem startContent={<Trash size={20} />}>Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        )
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
            Total {clients?.payload.length} clients
          </span>
          <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent rounded-md text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    )
  }, [
    filterValue,
    visibleColumns,
    onRowsPerPageChange,
    clients?.payload.length,
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="md:px-8">
      <div className="flex w-full items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold text-light-400">Guests</h1>
      </div>
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
          <TableBody emptyContent={'No clients found'} items={sortedItems}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Page
