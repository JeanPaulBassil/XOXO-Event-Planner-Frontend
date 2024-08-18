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
import { Order } from '@/api/models/Order.model'
import { OrdersApi } from '@/api/order.api'
import { Cake } from '@/api/models/Cake.model'
import { CakesApi } from '@/api/cake.api'
import { Extra } from '@/api/models/Extra.model'
import { ExtrasApi } from '@/api/extra.api'

type EventContextType = {
  events: Event[] | undefined
  isLoading: boolean
  createEvent: (
    newEvent: Partial<Event>,
    activities: Partial<Activity>[],
    orders: Partial<Order>[],
    cakes: Partial<Cake>[],
    extras: Partial<Extra>[]
  ) => Promise<void>
  getEvent: (id: number) => Promise<Event | undefined>
  editEvent: (
    id: number,
    updatedEvent: Partial<Event>,
    activities?: {
      newActivities: Partial<Activity>[]
      updatedActivities: Partial<Activity>[]
      deletedActivities: number[]
    },
    orders?: {
      newOrders: Partial<Order>[]
      updatedOrders: Partial<Order>[]
      deletedOrders: number[]
    },
    cakes?: { newCakes: Partial<Cake>[]; updatedCakes: Partial<Cake>[]; deletedCakes: number[] },
    extras?: {
      newExtras: Partial<Extra>[]
      updatedExtras: Partial<Extra>[]
      deletedExtras: number[]
    }
  ) => Promise<void>
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
  const ordersApi = new OrdersApi()
  const cakesApi = new CakesApi()
  const extrasApi = new ExtrasApi()

  const { data: events, isLoading } = useQuery<Event[], ServerError>({
    queryKey: ['events'],
    queryFn: async () => {
      const response: ApiResponse<Event[]> = await eventsApi.getEvents()
      return response.payload
    },
  })

  const { mutateAsync: createMutateAsync } = useMutation<
    Event,
    ServerError,
    {
      newEvent: Partial<Event>
      activities: Partial<Activity>[]
      orders: Partial<Order>[]
      cakes: Partial<Cake>[]
      extras: Partial<Extra>[]
    }
  >({
    mutationFn: async ({ newEvent, activities, orders, cakes, extras }) => {
      const clientResponse: ApiResponse<Client> = await clientsApi.createClient(
        newEvent.client as Client
      )
      const response: ApiResponse<Event> = await eventsApi.createEvent({
        ...newEvent,
        clientId: clientResponse.payload.id,
        paidAmount: newEvent.deposit || 0,
        remaining:
          newEvent.price! +
          newEvent.extraKidPrice! +
          newEvent.minimumCharge! -
          (newEvent.deposit || 0),
      } as Event)

      for (let activity of activities) {
        console.log(activity);
        try {
          let newActivity = {
            ...activity,
            eventId: response.payload.id,
          } as Activity

          await activitiesApi.createActivity(newActivity)
        } catch (error) {
          console.error(`Failed to save activity: ${activity.description}`, error)
        }
      }

      for (let order of orders) {
        try {
          let newOrder = {
            ...order,
            eventId: response.payload.id,
          } as Order

          await ordersApi.createOrder(newOrder)
        } catch (error) {
          console.error(`Failed to save order: ${order.unit}`, error)
        }
      }

      for (let cake of cakes) {
        console.log(cake)
        try {
          let newCake = {
            ...cake,
            eventId: response.payload.id,
          } as Cake

          await cakesApi.createCake(newCake)
        } catch (error) {
          console.error(`Failed to save cake: ${cake.type}`, error)
        }
      }

      for (let extra of extras) {
        console.log(extra)
        try {
          let newExtra = {
            ...extra,
            eventId: response.payload.id,
          } as Extra

          await extrasApi.createExtra(newExtra)
        } catch (error) {
          console.error(`Failed to save extra: ${extra.description}`, error)
        }
      }

      return response.payload
    },
    onMutate: async ({ newEvent }) => {
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

  const createEvent = async (
    newEvent: Partial<Event>,
    activities: Partial<Activity>[],
    orders: Partial<Order>[],
    cakes: Partial<Cake>[],
    extras: Partial<Extra>[]
  ) => {
    await createMutateAsync({ newEvent, activities, orders, cakes, extras })
  }

  const getEvent = async (id: number) => {
    return events?.find((event) => event.id === id)
  }

  const { mutateAsync: editMutateAsync } = useMutation<
    Event,
    ServerError,
    {
      id: number
      updatedEvent: Partial<Event>
      activities?: {
        newActivities: Partial<Activity>[]
        updatedActivities: Partial<Activity>[]
        deletedActivities: number[]
      }
      orders?: {
        newOrders: Partial<Order>[]
        updatedOrders: Partial<Order>[]
        deletedOrders: number[]
      }
      cakes?: { newCakes: Partial<Cake>[]; updatedCakes: Partial<Cake>[]; deletedCakes: number[] }
      extras?: {
        newExtras: Partial<Extra>[]
        updatedExtras: Partial<Extra>[]
        deletedExtras: number[]
      }
    }
  >({
    mutationFn: async ({ id, updatedEvent, activities, orders, cakes, extras }) => {
      if (updatedEvent.client) {
        if (updatedEvent.client.id)
          await clientsApi.updateClient(updatedEvent.client.id, updatedEvent.client)
      }

      console.log('updatedEvent', {
        ...updatedEvent,
        remaining:
          updatedEvent.price! +
          updatedEvent.extraKidPrice! +
          updatedEvent.minimumCharge! -
          (updatedEvent.paidAmount || updatedEvent.deposit!),
      })
      const response: ApiResponse<Event> = await eventsApi.updateEvent(id, {
        ...updatedEvent,
        remaining:
          updatedEvent.price! +
          updatedEvent.extraKidPrice! +
          updatedEvent.minimumCharge! -
          (updatedEvent.paidAmount || updatedEvent.deposit!),
      })
      console.log('response', response.payload)
      if (activities) {
        // Handle new activities
        for (let newActivity of activities.newActivities) {
          try {
            let newActivityWithEventId = { ...newActivity, eventId: id } as Activity
            await activitiesApi.createActivity(newActivityWithEventId)
          } catch (error) {
            console.error(`Failed to save new activity: ${newActivity.description}`, error)
          }
        }

        // Handle updated activities
        for (let updatedActivity of activities.updatedActivities) {
          try {
            if (updatedActivity.id) {
              await activitiesApi.updateActivity(updatedActivity.id, updatedActivity)
            }
          } catch (error) {
            console.error(`Failed to update activity: ${updatedActivity.description}`, error)
          }
        }

        // Handle deleted activities
        for (let activityId of activities.deletedActivities) {
          try {
            await activitiesApi.deleteActivity(activityId)
          } catch (error) {
            console.error(`Failed to delete activity with ID: ${activityId}`, error)
          }
        }
      }

      if (orders) {
        // Handle new activities
        for (let newOrder of orders.newOrders) {
          try {
            let newOrderWithEventId = { ...newOrder, eventId: id } as Order
            await ordersApi.createOrder(newOrderWithEventId)
          } catch (error) {
            console.error(`Failed to save new order: ${newOrder.unit}`, error)
          }
        }

        // Handle updated activities
        for (let updatedOrder of orders.updatedOrders) {
          try {
            if (updatedOrder.id) {
              await ordersApi.updateOrder(updatedOrder.id, updatedOrder)
            }
          } catch (error) {
            console.error(`Failed to update order: ${updatedOrder.unit}`, error)
          }
        }

        // Handle deleted activities
        for (let orderId of orders.deletedOrders) {
          try {
            await ordersApi.deleteOrder(orderId)
          } catch (error) {
            console.error(`Failed to delete order with ID: ${orderId}`, error)
          }
        }
      }

      if (cakes) {
        // Handle new activities
        for (let newCake of cakes.newCakes) {
          try {
            let newCakeWithEventId = { ...newCake, eventId: id } as Cake
            await cakesApi.createCake(newCakeWithEventId)
          } catch (error) {
            console.error(`Failed to save new cake: ${newCake.type}`, error)
          }
        }

        // Handle updated activities
        for (let updatedCake of cakes.updatedCakes) {
          try {
            if (updatedCake.id) {
              await cakesApi.updateCake(updatedCake.id, updatedCake)
            }
          } catch (error) {
            console.error(`Failed to update cake: ${updatedCake.type}`, error)
          }
        }

        // Handle deleted activities
        for (let cakeId of cakes.deletedCakes) {
          try {
            await cakesApi.deleteCake(cakeId)
          } catch (error) {
            console.error(`Failed to delete cake with ID: ${cakeId}`, error)
          }
        }
      }if (extras) {
        // Handle new activities
        for (let newExtra of extras.newExtras) {
          try {
            let newExtraWithEventId = { ...newExtra, eventId: id } as Extra
            await extrasApi.createExtra(newExtraWithEventId)
          } catch (error) {
            console.error(`Failed to save new extra: ${newExtra.description}`, error)
          }
        }

        // Handle updated activities
        for (let updatedExtra of extras.updatedExtras) {
          try {
            if (updatedExtra.id) {
              await extrasApi.updateExtra(updatedExtra.id, updatedExtra)
            }
          } catch (error) {
            console.error(`Failed to update extra: ${updatedExtra.description}`, error)
          }
        }

        // Handle deleted activities
        for (let extraId of extras.deletedExtras) {
          try {
            await extrasApi.deleteExtra(extraId)
          } catch (error) {
            console.error(`Failed to delete extra with ID: ${extraId}`, error)
          }
        }
      }

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
          previousEvents.map((event) =>
            event.id === id
              ? {
                  ...event,
                  ...updatedEvent,
                  remaining:
                    updatedEvent.price! +
                    updatedEvent.extraKidPrice! +
                    updatedEvent.minimumCharge! -
                    (updatedEvent.paidAmount || 0),
                }
              : event
          )
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

  const editEvent = async (
    id: number,
    updatedEvent: Partial<Event>,
    activities?: {
      newActivities: Partial<Activity>[]
      updatedActivities: Partial<Activity>[]
      deletedActivities: number[]
    },
    orders?: {
      newOrders: Partial<Order>[]
      updatedOrders: Partial<Order>[]
      deletedOrders: number[]
    },
    cakes?: { newCakes: Partial<Cake>[]; updatedCakes: Partial<Cake>[]; deletedCakes: number[] },
    extras?: {
      newExtras: Partial<Extra>[]
      updatedExtras: Partial<Extra>[]
      deletedExtras: number[]
    }

  ) => {
    await editMutateAsync({ id, updatedEvent, activities, orders, cakes, extras })
  }

  return (
    <EventContext.Provider value={{ events, isLoading, createEvent, getEvent, editEvent }}>
      {children}
    </EventContext.Provider>
  )
}
