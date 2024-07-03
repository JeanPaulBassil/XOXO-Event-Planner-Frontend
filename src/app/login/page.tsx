'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { Input } from '@nextui-org/input'
import Icon from '../_components/Icon'
import { Checkbox } from '@nextui-org/checkbox'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { AuthApi } from '@/api/auth.api'
import { useForm, Controller } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import { loginSchema } from '@/schemas/login.schema'
import { useMutation } from '@tanstack/react-query'
import { ServerError } from '@/api/utils'
import { Tokens } from '@/api/models/Tokens.model'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import { setTokens } from '@/utils/auth'

type FormData = {
  username: string
  password: string
  rememberMe: boolean
}

const page = () => {
  const [isVisible, setIsVisible] = useState(false)
  const authApi = new AuthApi()
  const router = useRouter()

  const toggleVisibility = () => setIsVisible(!isVisible)

  const {
    handleSubmit,
    register,
    control,
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
      rememberMe: false,
    },
  })

  const { mutateAsync } = useMutation<
    {
      accessToken: string
      refreshToken: string
      rememberMe: boolean
    },
    ServerError,
    FormData
  >({
    mutationFn: async (data) => {
      const response = await authApi.login(data.username, data.password)
      return {
        accessToken: response.payload.accessToken,
        refreshToken: response.payload.refreshToken,
        rememberMe: data.rememberMe,
      }
    },
    onSuccess: (data) => {
      try {
        setTokens(data.accessToken, data.refreshToken, data.rememberMe)
        router.push('/')
        console.log('hi')
        toast.success('Sign In Successful')
      } catch (error) {
        console.log('Error:', error)
      }
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
        const message = error.error.error.message
        if (message === 'Invalid credentials') {
          toast.error('Invalid Credentials')
        } else if (message === 'Session Expired') {
          toast.error('Session Expired')
        } else {
          toast.error('An error occurred')
        }
      }
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex w-full items-center justify-between border border-light-100 px-1 py-3 md:px-10 lg:px-3">
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="lg:w-[100px]" />
      </div>
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md px-4 py-20 md:px-9 lg:h-auto lg:w-[521px] lg:bg-light-100">
          <h1 className="text-lg font-bold sm:text-xl md:text-2xl">Welcome to The Event Manager</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <Input
              type="text"
              variant="underlined"
              label="Username"
              readOnly={isSubmitting}
              classNames={{
                input: 'bg-light-50 lg:bg-light-100',
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
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { onChange, value } }) => {
                return (
                  <Checkbox
                    defaultSelected
                    onValueChange={onChange}
                    isSelected={value}
                    size="sm"
                    color="danger"
                    className="mt-4"
                  >
                    Remember me
                  </Checkbox>
                )
              }}
            />
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
