'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { Input } from '@nextui-org/input'
import Icon from '../components/Icon'
import { Checkbox } from '@nextui-org/checkbox'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

type Props = {}

const page = (props: Props) => {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  return (
    <div className="flex h-screen flex-col">
      <div className="flex w-full items-center justify-between border border-light-100 px-1 py-3 lg:px-3 md:px-10">
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="lg:w-[100px]" />
      </div>
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md px-4 py-20 lg:h-auto lg:w-[521px] lg:bg-light-100 md:px-9">
          <h1 className="text-lg font-bold md:text-2xl sm:text-xl">Welcome to The Event Manager</h1>
          <Input
            type="text"
            variant="underlined"
            label="Username"
            classNames={{
              input: 'bg-light-50 lg:bg-light-100',
            }}
            isClearable
            className="mt-4"
          />
          <Input
            label="Password"
            variant="underlined"
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
          />
          <Checkbox color="danger" size="sm" className="mt-4 self-start">
            Keep Me Signed In
          </Checkbox>
          <button
            className="mt-4 w-full rounded-md bg-light-500 py-3 text-base font-bold text-light-50"
            onClick={() => toast.success('Sign In Successful')}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

export default page
