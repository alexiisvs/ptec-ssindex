export type UserProfile = {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type Fact = {
  id: string;
  text: string;
  length: number;
  source: string;
  liked: boolean;
  like_count: number;
  cached: boolean;
};

export type PageResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type UsernameAvailability = {
  username: string;
  available: boolean;
};

export type ErrorEnvelope = {
  code: string;
  message: string;
  request_id: string;
  details: unknown;
};
