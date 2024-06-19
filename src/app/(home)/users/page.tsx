'use client'
import React from 'react'
import { EllipsisVertical, Eye, Pen, Search, Trash } from 'lucide-react'
import { Input } from '@nextui-org/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
} from '@nextui-org/react'
import { Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react'
import { User } from '@nextui-org/user'
import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from '@nextui-org/react'
import Icon from '@/app/_components/Icon'

type UserType = {
  key: string
  name: string
  role: string
  lastLogin: string
  actions: string
}

//  enum for columnKey
enum ColumnKey {
  name = 'name',
  lastLogin = 'lastLogin',
  actions = 'actions',
}

const Page = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isVisible, setIsVisible] = useState(false)

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'lastLogin', label: 'Last Login' },
    { key: 'actions', label: '' },
  ]
  const data: UserType[] = [
    {
      key: '1',
      name: 'John Doe',
      role: 'Admin',
      lastLogin: '2 days ago',
      actions: 'Edit',
    },
    {
      key: '2',
      name: 'Jane Doe',
      role: 'User',
      lastLogin: '2 days ago',
      actions: 'Edit',
    },
    {
      key: '3',
      name: 'John Doe',
      role: 'Admin',
      lastLogin: '2 days ago',
      actions: 'Edit',
    },
    {
      key: '4',
      name: 'Jane Doe',
      role: 'User',
      lastLogin: '2 days ago',
      actions: 'Edit',
    },
    {
      key: '5',
      name: 'John Doe',
      role: 'Admin',
      lastLogin: '2 days ago',
      actions: 'Edit',
    },
    {
      key: '6',
      name: 'Jane Doe',
      role: 'User',
      lastLogin: '2 days ago',
      actions: 'Edit',
    },
    {
      key: '7',
      name: 'John Doe',
      role: 'Admin',
      lastLogin: '2 days ago',
      actions: 'Edit',
    },
    {
      key: '8',
      name: 'Jon Doe',
      role: 'User',
      lastLogin: '2 days ago',
      actions: 'Edit',
    },
  ]

  const [page, setPage] = useState(1)
  const rowsPerPage = 4

  const pages = Math.ceil(data.length / rowsPerPage)

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage

    return data.slice(start, end)
  }, [page, data])

  const renderCell = React.useCallback((user: UserType, columnKey: ColumnKey) => {
    const cellValue = user[columnKey]

    switch (columnKey) {
      case 'name':
        return (
          <User avatarProps={{ radius: 'full', src: '' }} description={user.role} name={cellValue}>
            {user.name}
          </User>
        )
      case 'actions':
        return (
          <div className="flex items-center justify-end">
            <Popover placement="bottom-end" radius="sm" shadow="sm">
              <PopoverTrigger className="hover:cursor-pointer">
                <EllipsisVertical size={18} />
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <div className="flex w-full flex-col">
                  <button className="flex items-center gap-3 bg-light-50 px-4 py-3 transition-all ease-in-out hover:bg-light-100">
                    <Eye size={18} />
                    <p>View</p>
                  </button>
                  <button className="flex items-center gap-3 bg-light-50 px-4 py-3 transition-all ease-in-out hover:bg-light-100">
                    <Pen size={18} />
                    <p>Edit</p>
                  </button>
                  <button className="flex items-center gap-3 bg-light-50 px-4 py-3 transition-all ease-in-out hover:bg-light-100">
                    <Trash size={18} />
                    <p>Delete</p>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )
      default:
        return cellValue
    }
  }, [])

  return (
    <div className="md:px-8">
      <Modal backdrop="blur" isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add User</ModalHeader>
              <ModalBody className='mb-4'>
                <Input
                  type="text"
                  variant="underlined"
                  label="Username"
                  // readOnly={isSubmitting}
                  classNames={{
                    input: 'bg-light-50 lg:bg-light-50',
                  }}
                  // isInvalid={!!errors.username}
                  // errorMessage={errors.username?.message}
                  isClearable
                  className="mt-4"
                  // {...register('username')}
                />
                <Input
                  label="Password"
                  variant="underlined"
                  // readOnly={isSubmitting}
                  // isInvalid={!!errors.password}
                  // errorMessage={errors.password?.message}
                  endContent={
                    <button className="focus:outline-none" type="button" onClick={() => setIsVisible(!isVisible)}>
                      {isVisible ? <Icon name="hidden" /> : <Icon name="eye" />}
                    </button>
                  }
                  type={isVisible ? 'text' : 'password'}
                  classNames={{
                    input: 'bg-light-50 lg:bg-light-50',
                  }}
                  className="mt-4"
                  // {...register('password')}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="success" onPress={onClose} className='text-light-50'>
                  Create
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="flex w-full items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold text-light-400">Users</h1>
        <button
          className="rounded-md bg-light-100 px-4 py-2 font-semibold text-light-400"
          onClick={onOpen}
        >
          Add User
        </button>
      </div>
      <div className="w-full px-4 py-3 md:w-96 md:px-4">
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
          startContent={<Search className="text-secondary-400" size={18} strokeWidth={1} />}
        />
      </div>
      <div className="w-full px-4 py-4 md:px-4">
        <Table
          removeWrapper
          isStriped
          bottomContent={
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="danger"
                page={page}
                total={pages}
                onChange={(page) => setPage(page)}
              />
            </div>
          }
          classNames={{
            wrapper: 'min-h-[222px]',
          }}
        >
          <TableHeader columns={columns}>
            {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
          </TableHeader>
          <TableBody items={items} emptyContent={'No Users Found.'}>
            {(item: UserType) => (
              <TableRow key={item.key}>
                {(columnKey) => (
                  <TableCell key={columnKey}>{renderCell(item, columnKey as ColumnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Page
