export interface RateLimitRule {
  windowMs: number;
  max: number;
  message?: string;
}
