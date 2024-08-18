export enum CakeDescription {
    TALENTSQUARE = 'PROVIDED_BY_TALENT_SQUARE_FOR_20_KIDS_EXTRA_QTY_USD_06_PC',
    OTHER = 'OTHER_CAKE_ORDERS',
    CAKEBYCLIENT = 'CAKE_BY_CLIENT_SERVICE_CHARGE'
}

export interface Cake {
    id?: number
    description: CakeDescription
    unitPrice: number
    quantity: number
    type: string
    event?: Event
    eventId?: number
}