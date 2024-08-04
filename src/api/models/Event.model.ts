import { Client } from "./Client.model"

export enum EventCategory {
    BabyShower = 'BABYSHOWER',
    BirthdayParty = 'BIRTHDAYPARTY',
    Baptism = 'BAPTISM',
}

export enum EventLocation {
    Indoor = 'INDOOR',
    Outdoor = 'OUTDOOR',
}

export interface Event {
    id?: number
    title: string
    category: EventCategory
    location: EventLocation
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
