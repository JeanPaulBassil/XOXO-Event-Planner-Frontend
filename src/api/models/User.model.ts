export interface User {
  id: number
  password?: string
  username: string
  refreshToken: string
  createdAt?: Date
  updatedAt?: Date
}
