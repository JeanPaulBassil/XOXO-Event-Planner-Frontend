// This interface showcase how the backend error response is structured.
// When the error is not from the backend, we still create a similar structure to maintain consistency.
// This interface should only be used when catching an error from the backend.
export interface ResponseError {
  error: {
    response:
      | {
          status: number
          errors: Record<string, string>
        }
      | string
    status: number
    // This is for prisma
    code?: number
    message: string
    name: string
  }
  timestamp: number
}

// This class encapsulates how the error is displayed in the frontend.
// All errors from the backend should be converted to this class.
export class ServerError {
  name = 'Error'
  message = 'Generic error message. Please contact the administrator.'
  status = 400
  timestamp = new Date().toISOString()

  constructor(public error: ResponseError) {
    this.name = this.error.error.name ?? 'Unknown Error Name'
    this.message = this.getDisplayErrorMessage()
    this.status = this.error.error.status ?? this.error.error.code ?? 'Unknown Error Status'
    // transform timestamp to Date object
    this.timestamp = new Date(this.error.timestamp).toISOString()
  }

  private getDisplayErrorMessage() {
    // Display deep errors first then shallow errors
    // Deep errors exists in response.errors
    // Shallow errors exists in error.response (if it is a string) or error.message
    if (this.error.error.response === undefined || typeof this.error.error.response === 'string') {
      return this.error.error.message ?? 'An Unknown Error Occurred'
    } else {
      if (this.error.error.response.errors === undefined) {
        return this.error.error.message ?? 'Unhandled Error Occurred'
      }

      const errors = this.error.error.response.errors as Record<string, string>
      return Object.values(errors)[0]
    }
  }
}
