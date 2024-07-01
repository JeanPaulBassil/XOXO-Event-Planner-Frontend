import { toZonedTime, format } from 'date-fns-tz';

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

export const zonedFormatDate = (dateString: string): string => {
  
  const timeZone = 'UTC'; // or your desired time zone
  const date = new Date(dateString);
  const zonedDate = toZonedTime(date, timeZone);

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(zonedDate);
  const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(zonedDate);

  const finalFormattedTime = formattedTime.replace(':00', '').replace(' AM', 'am').replace(' PM', 'pm');

  return `${formattedDate} at ${finalFormattedTime}`;
};