export interface ISearchRepository {
  saveQuery(customerId: string | null, query: string, resultsCount: number | null): Promise<void>;
  getRecentByCustomer(customerId: string, limit?: number): Promise<string[]>;
}
