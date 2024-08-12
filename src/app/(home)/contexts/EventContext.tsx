'use client'
import React, { createContext, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EventsApi } from '@/api/events.api'
import { Event } from '@/api/models/Event.model'
import { ApiResponse } from '@/api/utils/ApiResponse'
import { ServerError } from '@/api/utils/ResponseError'
import { ClientsApi } from '@/api/clients.api'
import { Client } from '@/api/models/Client.model'
import { ActivitiesApi } from '@/api/activity.api'
import { Activity } from '@/api/models/Activity.model'

type EventContextType = {
  events: Event[] | undefined
  isLoading: boolean
  createEvent: (newEvent: Partial<Event>, activities: Partial<Activity>[]) => Promise<void>
  getEvent: (id: number) => Promise<Event | undefined>
  editEvent: (id: number, updatedEvent: Partial<Event>) => Promise<void>
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export const useEvents = () => {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider')
  }
  return context
}

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient()
  const eventsApi = new EventsApi()
  const clientsApi = new ClientsApi()
  const activitiesApi = new ActivitiesApi()

  const { data: events, isLoading } = useQuery<Event[], ServerError>({
    queryKey: ['events'],
    queryFn: async () => {
      const response: ApiResponse<Event[]> = await eventsApi.getEvents()
      return response.payload
    },
  })

  const { mutateAsync: createMutateAsync } = useMutation<Event, ServerError, {newEvent: Partial<Event>; activities: Partial<Activity>[]}>({
    mutationFn: async ({newEvent, activities}) => {
      const clientResponse: ApiResponse<Client> = await clientsApi.createClient(
        newEvent.client as Client
      )
      const response: ApiResponse<Event> = await eventsApi.createEvent({
        ...newEvent,
        clientId: clientResponse.payload.id,
        paidAmount: newEvent.deposit || 0,
        remaining: (newEvent.price! + newEvent.extraKidPrice!) - (newEvent.deposit || 0),
      } as Event)

      for (let activity of activities) {
        try {
          let newActivity = {
            ...activity,
            eventId: response.payload.id,
          } as Activity

          await activitiesApi.createActivity(newActivity)
        } catch (error) {
          console.error(`Failed to save activity: ${activity.name}`, error);
        }
      }

      return response.payload
    },
    onMutate: async ({newEvent, activities}) => {
      await queryClient.cancelQueries({
        queryKey: ['events'],
      })
      const previousEvents = queryClient.getQueryData<Event[]>(['events'])
      if (previousEvents) {
        queryClient.setQueryData<Event[]>(
          ['events'],
          [...previousEvents, { ...newEvent, id: Date.now() } as Event]
        )
      }
      return { previousEvents }
    },
    onError: (err, newEvent, context) => {
      const { previousEvents } = context as { previousEvents: Event[] }
      queryClient.setQueryData<Event[]>(['events'], previousEvents)
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['events'],
      })
    },
  })

  const createEvent = async (newEvent: Partial<Event>, activities: Partial<Activity>[]) => {
    await createMutateAsync({newEvent, activities})
  }

  const getEvent = async (id: number) => {
    return events?.find((event) => event.id === id)
  }

  const { mutateAsync: editMutateAsync } = useMutation<
    Event,
    ServerError,
    { id: number; updatedEvent: Partial<Event> }
  >({
    mutationFn: async ({ id, updatedEvent }) => {
      if (updatedEvent.client) {
        if (updatedEvent.client.id)
          await clientsApi.updateClient(updatedEvent.client.id, updatedEvent.client)
      }

      console.log("updatedEvent", {
        ...updatedEvent,
        remaining: ((updatedEvent.price! + updatedEvent.extraKidPrice!) - (updatedEvent.paidAmount || updatedEvent.deposit!)),
      })
      const response: ApiResponse<Event> = await eventsApi.updateEvent(id, {
        ...updatedEvent,
        remaining: ((updatedEvent.price! + updatedEvent.extraKidPrice!) - (updatedEvent.paidAmount || updatedEvent.deposit!)),
      })
      console.log("response", response.payload)
      return response.payload
    },
    onMutate: async ({ id, updatedEvent }) => {
      await queryClient.cancelQueries({
        queryKey: ['events'],
      })
      const previousEvents = queryClient.getQueryData<Event[]>(['events'])
      if (previousEvents) {
        queryClient.setQueryData<Event[]>(
          ['events'],
          previousEvents.map((event) => (event.id === id ? { ...event, ...updatedEvent, remaining: (updatedEvent.price! + updatedEvent.extraKidPrice!) - (updatedEvent.paidAmount || 0) } : event))
        )
      }
      return { previousEvents }
    },
    onError: (err, { id, updatedEvent }, context) => {
      const { previousEvents } = context as { previousEvents: Event[] }
      queryClient.setQueryData<Event[]>(['events'], previousEvents)
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['events'],
      })
    },
  })

  const editEvent = async (id: number, updatedEvent: Partial<Event>) => {
    await editMutateAsync({ id, updatedEvent })
  }

  return (
    <EventContext.Provider value={{ events, isLoading, createEvent, getEvent, editEvent }}>
      {children}
    </EventContext.Provider>
  )
}
