export interface RateLimitStrategy {
  isAllowed(id: string): Promise<boolean>;
}
