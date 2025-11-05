interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    throw new Error('Not implemented');
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    throw new Error('Not implemented');
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    throw new Error('Not implemented');
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    throw new Error('Not implemented');
  }
}

export default new ApiService();