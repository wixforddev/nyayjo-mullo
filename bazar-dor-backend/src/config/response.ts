interface ResponseData {
  type?: string;
  attributes?: any;
  token?: any;
  [key: string]: any;
}

interface ResponseInput {
  statusCode?: number;
  message?: string;
  data?: ResponseData;
  type?: string;
  status?: string;
  token?: any;
  tokens?: any;
  code?: string | number;
}

const response = (response: ResponseInput = {}) => {
  const responseObject: any = {
    code: response.statusCode || response.code,
    message: response.message,
    data: {} as ResponseData,
  };

  if (response.type) {
    responseObject.data.type = response.type;
  }

  if (response.data) {
    responseObject.data.attributes = response.data;
  }

  if (response.token) {
    responseObject.data.token = response.tokens;
  }

  return responseObject;
};

export default response;
