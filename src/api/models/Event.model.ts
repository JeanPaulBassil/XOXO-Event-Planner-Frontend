import { Client } from "./Client.model"

export enum EventCategory {
    BabyShower = 'BABYSHOWER',
    BirthdayParty = 'BIRTHDAYPARTY',
    Baptism = 'BAPTISM',
}

export interface Event {
    id?: number
    title: string
    category: EventCategory
    price: number
    deposit: number
    remaining: number
    description: string
    startDate: string
    endDate: string
    client?: Client
    clientId?: number
    ageGroup: string
    numberOfAttendees: number
    extraNote: string
    paidAmount: number
}
