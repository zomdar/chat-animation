import { useEffect, useState } from "react";

type UserLocationTime = {
  location: string;
  dateTime: string;
};

const DEFAULT_VALUE: UserLocationTime = {
  location: "",
  dateTime: "",
};

const formatLocation = (timeZone: string, locale: string): string => {
  if (!timeZone) {
    return "";
  }

  const [, ...citySegments] = timeZone.split("/");
  const hasCitySegments = citySegments.length > 0;
  const city = (hasCitySegments ? citySegments : [timeZone])
    .map((segment) => segment.replace(/_/g, " "))
    .join(", ");

  let regionCode: string | undefined;
  try {
    regionCode = new Intl.Locale(locale).region ?? undefined;
  } catch {
    regionCode = undefined;
  }

  return [city, regionCode].filter(Boolean).join(", ");
};

const formatDateTime = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
};

export const useUserLocationTime = (refreshIntervalMs = 1000) => {
  const [data, setData] = useState<UserLocationTime>(DEFAULT_VALUE);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const locale = navigator.language || "en-US";

    const update = () => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();

      setData({
        location: formatLocation(timeZone, locale),
        dateTime: formatDateTime(now, locale),
      });
    };

    update();
    const interval = window.setInterval(update, refreshIntervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshIntervalMs]);

  return data;
};
