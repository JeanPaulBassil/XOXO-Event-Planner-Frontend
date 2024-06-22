export interface User {
  id: number
  password?: string
  username: string
  lastLogin?: string
  role: string
  refreshToken: string
  createdAt?: Date
  updatedAt?: Date
}
