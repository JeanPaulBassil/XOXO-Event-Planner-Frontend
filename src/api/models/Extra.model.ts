export enum ExtraType {
    BALLOON_ARC = 'BALLOON_ARCH',
    BALLOON_HELIUM = 'BALLOON_HELIUM',
    BALLOON_MILAR = 'BALLOON_MILAR',
    TABLE_DECORATION = 'TABLE_DECORATION',
    PERSONALIZED_ITEMS = 'PERSONALIZED_ITEMS',
    PRINCESS = 'PRINCESS',
    CHARACTERS = 'CHARACTERS',
    PRIVATE_VENUE = 'PRIVATE_VENUE',
    PINATA = 'PINATA',
    REFILL_PINATA = 'REFILL_PINATA'
}

export interface Extra {
    id?: number
    description: ExtraType
    unitPrice: number
    quantity: number
    event?: Event
    eventId?: number
}