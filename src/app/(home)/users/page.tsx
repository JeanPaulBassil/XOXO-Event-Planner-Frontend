'use client'
import React, { useState, useCallback, useMemo } from 'react'
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  User,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  SortDescriptor,
  Autocomplete,
  AutocompleteItem,
  Spinner,
} from '@nextui-org/react'
import Icon from '@/app/_components/Icon'
import { UsersApi } from '@/api/users.api'
import { ApiResponse, ServerError } from '@/api/utils'
import { User as UserModel } from '@/api/models/User.model'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/utils/date'
import { Controller, set, useForm } from 'react-hook-form'
import Joi from 'joi'
import { joiResolver } from '@hookform/resolvers/joi'
import toast from 'react-hot-toast'

type UserType = {
  key: string
  name: string
  role: string
  lastLogin: string
  actions: string
}

enum Roles {
  Admin = 'Admin',
  User = 'User',
}

enum ColumnKey {
  name = 'name',
  lastLogin = 'lastLogin',
  actions = 'actions',
}

type FormData = {
  username: string
  password: string
  role: Roles
}

type EditFormData = {
  username: string
  role: Roles
}

enum SelectedMode {
  Edit = 'edit',
  Delete = 'delete',
}

const createUserSchema = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': 'Username is required',
  }),
  password: Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})'))
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.pattern.base':
        'Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one digit, and one special character.',
    }),
  role: Joi.string().required().valid(Roles.Admin, Roles.User).messages({
    'string.empty': 'Role is required',
    'any.only': 'Role must be either Admin or User',
  }),
})

const editUserSchema = Joi.object({
  username: Joi.string().messages({
    'string.empty': 'Username is required',
  }),
  role: Joi.string().valid(Roles.Admin, Roles.User).messages({
    'string.empty': 'Role is required',
    'any.only': 'Role must be either Admin or User',
  }),
})

const Page = () => {
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const [isVisible, setIsVisible] = useState(false)
  const [filterValue, setFilterValue] = React.useState('')
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [selectedMode, setSelectedMode] = useState<SelectedMode | null>(null)

  const handleSelected = (user: UserType, mode: SelectedMode) => {
    setSelectedUser(user)
    setSelectedMode(mode)
    if (mode === SelectedMode.Edit) {
      editReset({
        username: user.name,
        role: user.role === Roles.Admin ? Roles.Admin : Roles.User,
      })
      onEditOpen()
    } else {
      onDeleteOpen()
    }
  }

  const hasSearchFilter = Boolean(filterValue)

  const usersApi = new UsersApi()

  const { data: users, isLoading } = useQuery<ApiResponse<UserModel[]>, ServerError>({
    queryKey: ['users'],
    queryFn: async () => await usersApi.getUsers(),
  })

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...(users?.payload || [])]

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.username.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredUsers
  }, [users, filterValue])

  const {
    handleSubmit,
    register,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: joiResolver(createUserSchema),
  })

  const {
    handleSubmit: handeEditSubmit,
    register: editRegister,
    setError: editSetError,
    reset: editReset,
    control: editControl,
    formState: { errors: editErrors, isSubmitting: editIsSubmitting, isDirty: editIsDirty },
  } = useForm<EditFormData>({
    resolver: joiResolver(editUserSchema),
  })

  const onSubmit = async (data: FormData) => {
    const tempUser = {
      id: 999999,
      username: data.username,
      lastLogin: null,
      role: data.role,
    }

    const previousUsers = users?.payload || []
    const newUsers = [tempUser, ...previousUsers]
    queryClient.setQueryData(['users'], { payload: newUsers })

    try {
      const response = await usersApi.createUser(data.username, data.password, data.role)
      queryClient.setQueryData(['users'], (oldData: ApiResponse<UserModel[]>) => {
        return {
          payload: oldData.payload.map((user) =>
            user.id === tempUser.id ? response.payload : user
          ),
        }
      })
      toast.success(
        `${response.payload.role.toLowerCase()} ${response.payload.username} created successfully.`
      )
      reset()
      onCreateClose()
    } catch (error) {
      if (error instanceof ServerError) {
        setError('root', {
          message: error.message,
        })
        toast.error(error.message)
      }
      // Revert the optimistic update if the API call fails
      queryClient.setQueryData(['users'], { payload: previousUsers })
    }
  }

  const onDeleteUser = async (id: string | undefined) => {
    const previousUsers = users?.payload || []
    const newUsers = previousUsers.filter((user) => user.id.toString() !== id)
    queryClient.setQueryData(['users'], { payload: newUsers })

    try {
      const response = await usersApi.deleteUser(id || '')
      queryClient.setQueryData(['users'], (oldData: ApiResponse<UserModel[]>) => {
        return {
          payload: oldData.payload.filter((user) => user.id !== response.payload.id),
        }
      })
      toast.success(
        `${response.payload.role.toLowerCase()} ${response.payload.username} deleted successfully.`
      )
    } catch (error) {
      if (error instanceof ServerError) {
        toast.error(error.message)
      }
      queryClient.setQueryData(['users'], { payload: previousUsers })
    }
  }

  const onEditSubmit = async (data: EditFormData) => {
    if (!selectedUser) return

    const updatedUser: UserModel = {
      id: parseInt(selectedUser.key),
      username: data.username,
      refreshToken: selectedUser.name,
      role: data.role,
    }

    const previousUsers = users?.payload || []
    const newUsers: UserModel[] = previousUsers.map((user) => {
      if (user.id.toString() === selectedUser.key) {
        return updatedUser
      }
      return user
    })
    queryClient.setQueryData(['users'], { payload: newUsers })

    try {
      const response = await usersApi.editUser(selectedUser.key, data.username, data.role)
      queryClient.setQueryData(['users'], (oldData: ApiResponse<UserModel[]>) => {
        return {
          payload: oldData.payload.map((user) =>
            user.id === response.payload.id ? response.payload : user
          ),
        }
      })
      toast.success(
        `${response.payload.role.toLowerCase()} ${response.payload.username} updated successfully.`
      )
      reset()
      onEditClose()
    } catch (error) {
      if (error instanceof ServerError) {
        setError('root', {
          message: error.message,
        })
        toast.error(error.message)
      }
      // Revert the optimistic update if the API call fails
      queryClient.setQueryData(['users'], { payload: previousUsers })
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'lastLogin', label: 'Last Login' },
    { key: 'actions', label: '' },
  ]
  const data: UserType[] =
    filteredItems.map((user: UserModel) => {
      return {
        key: user.id.toString(),
        name: user.username,
        role: user.role?.toLowerCase() ?? Roles.Admin,
        lastLogin: user.lastLogin ? formatDate(user.lastLogin) : 'User never logged in',
        actions: 'Edit',
      }
    }) || []

  const onSearchChange = React.useCallback((value: string) => {
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

  const [page, setPage] = useState(1)
  const rowsPerPage = 5

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  })

  const sortedData = useMemo(() => {
    if (!data) return []

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortDescriptor.column as keyof UserType]
      const bValue = b[sortDescriptor.column as keyof UserType]

      if (sortDescriptor.direction === 'ascending') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return sorted
  }, [data, sortDescriptor])

  const pages = Math.ceil(sortedData.length / rowsPerPage)

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage

    return sortedData.slice(start, end)
  }, [page, sortedData])

  const onSortChange = useCallback((descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor)
  }, [])

  const renderCell = useCallback((user: UserType, columnKey: ColumnKey) => {
    const cellValue = user[columnKey]

    switch (columnKey) {
      case 'name':
        return (
          <User avatarProps={{ radius: 'full', src: '' }} description={user.role} name={cellValue}>
            {user.name}
          </User>
        )
      case 'actions':
        return <PopoverButton handleSelected={handleSelected} user={user} />
      default:
        return cellValue
    }
  }, [])

  return (
    <div className="md:px-8">
      <Modal backdrop="blur" isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add User</ModalHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <ModalBody className="mb-4">
                  <Input
                    type="text"
                    variant="underlined"
                    label="Username"
                    readOnly={isSubmitting}
                    classNames={{
                      input: 'bg-light-50 lg:bg-light-50',
                    }}
                    isInvalid={!!errors.username}
                    errorMessage={errors.username?.message}
                    isClearable
                    className="mt-4"
                    {...register('username')}
                  />
                  <Input
                    label="Password"
                    variant="underlined"
                    readOnly={isSubmitting}
                    isInvalid={!!errors.password}
                    errorMessage={errors.password?.message}
                    endContent={
                      <button
                        className="focus:outline-none"
                        type="button"
                        onClick={() => setIsVisible(!isVisible)}
                      >
                        {isVisible ? <Icon name="hidden" /> : <Icon name="eye" />}
                      </button>
                    }
                    type={isVisible ? 'text' : 'password'}
                    classNames={{
                      input: 'bg-light-50 lg:bg-light-50',
                    }}
                    className="mt-4"
                    {...register('password')}
                  />
                  <Controller
                    name="role"
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => {
                      return (
                        <Autocomplete
                          label="Select Role"
                          className="mt-4"
                          value={value}
                          selectedKey={value ? value.toString() : ''}
                          color="default"
                          onSelectionChange={onChange}
                          isInvalid={errors.role ? true : false}
                          errorMessage={errors.role?.message ?? ''}
                          onBlur={onBlur}
                          variant="flat"
                          inputProps={{
                            classNames: {
                              base: 'bg-white',
                              inputWrapper:
                                "px-1 bg-white shadow-none data-[hover=true]:bg-white group-data-[focus=true]:bg-white border-b-3 border-light-200 rounded-none after:content-[''] after:w-0 after:origin-center after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-[2px] after:h-[2px] data-[open=true]:after:w-full data-[focus=true]:after:w-full after:bg-light-900 after:transition-width motion-reduce:after:transition-none",
                              label: 'text-light-300 dark:text-secondary-400 text-small',
                              input: 'text-secondary-950 dark:text-white',
                            },
                          }}
                        >
                          <AutocompleteItem key={Roles.Admin} value={Roles.Admin}>
                            {Roles.Admin}
                          </AutocompleteItem>
                          <AutocompleteItem key={Roles.User} value={Roles.User}>
                            {Roles.User}
                          </AutocompleteItem>
                        </Autocomplete>
                      )
                    }}
                  ></Controller>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
                      reset()
                      onClose()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" color="success" className="text-light-50">
                    Create
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal backdrop="blur" isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Delete {selectedUser?.role} {selectedUser?.name}?
              </ModalHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <ModalBody className="mb-4">
                  <p className="text-sm text-light-300">
                    Are you sure you want to delete this user?
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
                      onClose()
                      setSelectedUser(null)
                      setSelectedMode(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      onDeleteUser(selectedUser?.key)
                      onClose()
                      setSelectedUser(null)
                      setSelectedMode(null)
                    }}
                    color="danger"
                    className="text-light-50"
                  >
                    Delete
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal backdrop="blur" isOpen={isEditOpen} onClose={onEditClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Editing {selectedUser?.role} {selectedUser?.name}
              </ModalHeader>
              <form onSubmit={handeEditSubmit(onEditSubmit)}>
                <ModalBody className="mb-4">
                  <Input
                    type="text"
                    variant="underlined"
                    label="Username"
                    readOnly={editIsSubmitting}
                    classNames={{
                      input: 'bg-light-50 lg:bg-light-50',
                    }}
                    isInvalid={!!editErrors.username}
                    errorMessage={editErrors.username?.message}
                    isClearable
                    className="mt-4"
                    {...editRegister('username')}
                  />
                  <Controller
                    name="role"
                    control={editControl}
                    defaultValue={selectedUser?.role === Roles.Admin ? Roles.Admin : Roles.User}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Autocomplete
                        label="Select Role"
                        className="mt-4"
                        value={value}
                        selectedKey={value ? value.toString() : ''}
                        color="default"
                        onSelectionChange={onChange}
                        isInvalid={editErrors.role ? true : false}
                        errorMessage={editErrors.role?.message ?? ''}
                        onBlur={onBlur}
                        variant="flat"
                        inputProps={{
                          classNames: {
                            base: 'bg-white',
                            inputWrapper:
                              "px-1 bg-white shadow-none data-[hover=true]:bg-white group-data-[focus=true]:bg-white border-b-3 border-light-200 rounded-none after:content-[''] after:w-0 after:origin-center after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-[2px] after:h-[2px] data-[open=true]:after:w-full data-[focus=true]:after:w-full after:bg-light-900 after:transition-width motion-reduce:after:transition-none",
                            label: 'text-light-300 dark:text-secondary-400 text-small',
                            input: 'text-secondary-950 dark:text-white',
                          },
                        }}
                      >
                        <AutocompleteItem key={Roles.Admin} value={Roles.Admin}>
                          {Roles.Admin}
                        </AutocompleteItem>
                        <AutocompleteItem key={Roles.User} value={Roles.User}>
                          {Roles.User}
                        </AutocompleteItem>
                      </Autocomplete>
                    )}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
                      editReset()
                      onClose()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" color="success" className="text-light-50">
                    Update
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="flex w-full items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold text-light-400">Users</h1>
        <button
          className="rounded-md bg-light-100 px-4 py-2 font-semibold text-light-400"
          onClick={onCreateOpen}
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
          value={filterValue}
          onClear={onClear}
          onValueChange={onSearchChange}
          startContent={<Search className="text-secondary-400" size={18} strokeWidth={1} />}
        />
      </div>
      <div className="w-full px-4 py-4 md:px-4">
        <Table
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
          removeWrapper
          isStriped
          bottomContent={
            <div className="z-0 flex w-full justify-center">
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
            {(column) => (
              <TableColumn
                allowsSorting={column.key === 'name'}
                allowsResizing
                key={column.key}
                className={`${column.key === 'name' ? 'w-[40%]' : ''}`}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            loadingContent={<Spinner className="mx-auto" size="md" color="default" />}
            isLoading={isLoading}
            items={items}
            emptyContent={'No Users Found.'}
          >
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

type PopoverButtonProps = {
  handleSelected: (user: UserType, mode: SelectedMode) => void
  user: UserType
}

const PopoverButton = ({ handleSelected, user }: PopoverButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex items-center justify-end">
      <Popover
        placement="bottom-end"
        radius="sm"
        shadow="sm"
        isOpen={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
      >
        <PopoverTrigger className="hover:cursor-pointer">
          <EllipsisVertical size={18} />
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <div className="flex w-full flex-col">
            <button
              onClick={() => {
                setIsOpen(false)
                handleSelected(user, SelectedMode.Edit)
              }}
              className="flex items-center gap-3 bg-light-50 px-4 py-3 transition-all ease-in-out hover:bg-light-100"
            >
              <Pen size={18} />
              <p>Edit</p>
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                handleSelected(user, SelectedMode.Delete)
              }}
              className="flex items-center gap-3 bg-light-50 px-4 py-3 transition-all ease-in-out hover:bg-light-100"
            >
              <Trash size={18} />
              <p>Delete</p>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default Page
