export class ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static error(message: string, data?: any): ApiResponse {
    return new ApiResponse(false, message, data);
  }
}

export class PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  timestamp: string;

  constructor(
    message: string,
    data: T[],
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number,
  ) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.pagination = {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
    };
    this.timestamp = new Date().toISOString();
  }
}
