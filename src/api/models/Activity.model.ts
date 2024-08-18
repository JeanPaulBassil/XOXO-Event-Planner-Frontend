export enum ActivityType {
    SoftPlayEntrance = 'SOFT_PLAY_ENTRANCE',
    ThreeGamesTwoDances = 'THREE_GAMES_TWO_DANCES',
    CeramicColoring = 'CERAMIC_COLORING',
    CupcakeDecoration = 'CUPCAKE_DECORATION',
    FunnyMascotShow = 'FUNNY_MASCOT_SHOW',
    Theatre = 'THEATRE',
    StoryTelling = 'STORY_TELLING',
    SuperPowers = 'SUPER_POWERS',
    Spa = 'SPA',
    Zumba = 'ZUMBA',
    DogShow = 'DOG_SHOW',
    BubbleShow = 'BUBBLE_SHOW',
    Magician = 'MAGICIAN',
    DressUp = 'DRESS_UP',
    Clown = 'CLOWN',
    MAndMrsClown = 'M_AND_MRS_CLOWN',
    PuppetShow = 'PUPPET_SHOW'
}

export interface Activity {
    id?: number
    description: ActivityType
    price: number
    event?: Event
    eventId?: number
}