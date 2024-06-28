'use client'
import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EventsApi } from '@/api/events.api';
import { Event } from '@/api/models/Event.model';
import { ApiResponse } from '@/api/utils/ApiResponse';
import { ServerError } from '@/api/utils/ResponseError';

type EventContextType = {
  events: Event[] | undefined;
  isLoading: boolean;
  createEvent: (newEvent: Partial<Event>) => Promise<void>;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const eventsApi = new EventsApi();

  const { data: events, isLoading } = useQuery<Event[], ServerError>({
    queryKey: ['events'],
    queryFn: async () => {
      const response: ApiResponse<Event[]> = await eventsApi.getEvents();
      return response.payload;
    },
  });

  const { mutateAsync } = useMutation<Event, ServerError, Partial<Event>>(
    {
      mutationFn: async (newEvent: Partial<Event>) => {
        const response: ApiResponse<Event> = await eventsApi.createEvent(newEvent as Event);
        return response.payload;
      },
      onMutate: async (newEvent: Partial<Event>) => {
        await queryClient.cancelQueries({
          queryKey: ['events'],
        });
        const previousEvents = queryClient.getQueryData<Event[]>(['events']);
        if (previousEvents) {
          queryClient.setQueryData<Event[]>(['events'], [...previousEvents, { ...newEvent, id: Date.now() } as Event]);
        }
        return { previousEvents };
      },
      onError: (err, newEvent, context) => {
        const { previousEvents } = context as { previousEvents: Event[] };
          queryClient.setQueryData<Event[]>(['events'], previousEvents);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: ['events'],
        });
      },
    }
  );

  const createEvent = async (newEvent: Partial<Event>) => {
    await mutateAsync(newEvent);
  };

  return (
    <EventContext.Provider value={{ events, isLoading, createEvent }}>
      {children}
    </EventContext.Provider>
  );
};
