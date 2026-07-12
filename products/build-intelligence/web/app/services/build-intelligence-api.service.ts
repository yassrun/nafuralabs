import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BuildIntelligenceApiService {
  private readonly baseUrl = '/api/v1/build-intelligence';

  async listDocuments(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/documents`);
    return response.json();
  }
}
