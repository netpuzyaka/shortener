export type NameCount = {
  name: string | null;
  cnt: number;
};

export type DayCount = {
  day: string;
  cnt: number;
};

export type HourCount = {
  hour: number;
  cnt: number;
};

export type LinkStats = {
  total_clicks: number;
  unique_visitors: number;
  clicks_by_country: NameCount[];
  clicks_by_region: NameCount[];
  clicks_by_city: NameCount[];
  clicks_by_device: NameCount[];
  clicks_by_browser: NameCount[];
  clicks_by_os: NameCount[];
  clicks_by_referrer: NameCount[];
  clicks_by_day: DayCount[];
  clicks_by_hour: HourCount[];
};

export type RecentClick = {
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  created_at: string;
};
