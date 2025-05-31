import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export const formatDate = (date: string, format = "LL"): string => {
  return dayjs(date).format(format);
};

export const formatTime = (date: string, format = "LT"): string => {
  // Handle time-only strings (HH:MM:SS) by creating a valid date object first
  if (/^\d{2}:\d{2}:\d{2}$/.test(date)) {
    // Create a valid date object with today's date and the time
    const today = new Date();
    const [hours, minutes, seconds] = date.split(":").map(Number);

    // Create a new date with today's date and the time components
    const dateObj = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hours,
      minutes,
      seconds
    );

    return dayjs(dateObj).format(format);
  }

  return dayjs(date).format(format);
};

export const formatDateTime = (date: string, format = "LLL"): string => {
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string): string => {
  return dayjs(date).fromNow();
};

export const isEventToday = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), "day");
};

export const isEventUpcoming = (date: string): boolean => {
  return dayjs(date).isAfter(dayjs());
};

export const isEventPast = (date: string): boolean => {
  return dayjs(date).isBefore(dayjs());
};

export const getDaysBetween = (startDate: string, endDate: string): number => {
  return dayjs(endDate).diff(dayjs(startDate), "day");
};

export const getDateRangeDisplay = (
  startDate: string,
  endDate: string
): string => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (start.isSame(end, "day")) {
    return `${formatDate(startDate, "MMM D, YYYY")}`;
  } else if (start.isSame(end, "month")) {
    return `${start.format("MMM D")} - ${end.format("D, YYYY")}`;
  } else if (start.isSame(end, "year")) {
    return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
  } else {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
};
