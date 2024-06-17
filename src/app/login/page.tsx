'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { Input } from '@nextui-org/input'
import Icon from '../components/Icon'
import { Checkbox } from '@nextui-org/checkbox'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { AuthApi } from '@/api/auth.api'
import { Resolver } from 'dns'
import { useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import { loginSchema } from '@/schemas/login.schema'
import { useMutation } from '@tanstack/react-query'
import { ServerError } from '@/api/utils'
import { Tokens } from '@/api/models/Tokens.model'
import { ResponseError } from '@/api/utils'

type FormData = {
  username: string
  password: string
}

const page = () => {
  const [isVisible, setIsVisible] = useState(false)
  const authApi = new AuthApi()

  const toggleVisibility = () => setIsVisible(!isVisible)

  const {
    handleSubmit,
    reset,
    register,
    control,
    setValue,
    resetField,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: joiResolver(loginSchema, {
      abortEarly: false,
      messages: {
        'string.base': 'Username must be a string',
        'string.empty': 'Username is required',
      },
    }),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const { mutateAsync } = useMutation<Tokens, ServerError, FormData>({
    mutationFn: async (data) => {
      const response = await authApi.login(data.username, data.password)
      return response.payload
    },
    onSuccess: () => {
      toast.success('Sign In Successful')
    },
    onSettled: () => {
      reset({
        username: '',
        password: '',
      })
      // navigate to dashboard
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!isDirty) {
      toast.error('No Changes Detected.')
      return
    }

    try {
      await mutateAsync(data)
    } catch (error) {
      if (error instanceof ServerError) {
        toast.error(error.error.error.message)
      }
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex w-full items-center justify-between border border-light-100 px-1 py-3 lg:px-3 md:px-10">
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="lg:w-[100px]" />
      </div>
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md px-4 py-20 lg:h-auto lg:w-[521px] lg:bg-light-100 md:px-9">
          <h1 className="text-lg font-bold md:text-2xl sm:text-xl">Welcome to The Event Manager</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <Input
              type="text"
              variant="underlined"
              label="Username"
              readOnly={isSubmitting}
              classNames={{
                input: 'bg-light-50 lg:bg-light-100',
              }}
              isClearable
              className="mt-4"
              {...register('username')}
            />
            {errors.username && <p className="text-red-500">{errors.username.message}</p>}
            <Input
              label="Password"
              variant="underlined"
              readOnly={isSubmitting}
              endContent={
                <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                  {isVisible ? <Icon name="hidden" /> : <Icon name="eye" />}
                </button>
              }
              type={isVisible ? 'text' : 'password'}
              classNames={{
                input: 'bg-light-50 lg:bg-light-100',
              }}
              className="mt-4"
              {...register('password')}
            />
            {errors.password && <p className="text-red-500">{errors.password.message}</p>}
            <Checkbox color="danger" size="sm" className="mt-4 self-start">
              Keep Me Signed In
            </Checkbox>
            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-light-500 py-3 text-base font-bold text-light-50"
              disabled={isSubmitting}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}

export default page
