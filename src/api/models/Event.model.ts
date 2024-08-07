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

export enum EventStatus {
    Tentative = 'TENTATIVE',
    Confirmed = 'CONFIRMED',
}

export interface Event {
    id?: number
    title: string
    category: EventCategory
    location: EventLocation
    status: EventStatus
    price: number
    extraKidPrice: number
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
