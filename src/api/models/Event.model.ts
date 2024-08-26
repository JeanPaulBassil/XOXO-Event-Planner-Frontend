import { Client } from "./Client.model"

export enum EventCategory {
    BabyShower = 'BABYSHOWER',
    BirthdayParty = 'BIRTHDAYPARTY',
    Baptism = 'BAPTISM',
    Playground = 'PLAYGROUND',
    Events = 'EVENTS',
    Birthday = 'BIRTHDAY',
    Concert = 'CONCERT',
    ArtExhibition = 'ART_EXHIBITION',
    StageShows = 'STAGE_SHOWS',
    GenderReveal = 'GENDER_REVEAL',
    Communion = 'COMMUNION',
    ArtisticParades = 'ARTISTIC_PARADES',
    SummerCamper = 'SUMMER_CAMPER',
    NurseriesVisit = 'NURSERIES_VISIT',
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
    minimumCharge: number
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
