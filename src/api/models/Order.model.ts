export interface Order {
    id?: number
    unit: string
    description: string
    unitPrice: number
    quantity: number
    event?: Event
    eventId?: number
}