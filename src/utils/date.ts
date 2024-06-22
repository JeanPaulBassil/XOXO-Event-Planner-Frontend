export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date)
  const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(date)

  return `${formattedDate} at ${formattedTime}`
}
