export enum EventCategory {
    BabyShower = 'Baby Shower',
    BirthdayParty = 'Birthday Party',
    Baptism = 'Baptism',
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
}