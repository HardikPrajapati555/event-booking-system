class ApiResponse {
    constructor(statusCode, message, data = null) {
      this.success = statusCode < 400;
      this.statusCode = statusCode;
      this.message = message;
      this.data = data;
      this.timestamp = new Date().toISOString();
    }
  
    static success(message, data = null) {
      return new ApiResponse(200, message, data);
    }
  
    static created(message, data = null) {
      return new ApiResponse(201, message, data);
    }
  
    static noContent(message = 'No content') {
      return new ApiResponse(204, message);
    }
  }
  
  module.exports = {
    ApiResponse
  };