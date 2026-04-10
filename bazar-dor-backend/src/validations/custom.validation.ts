import { CustomHelpers } from 'joi';

const objectId = (value: string, helpers: CustomHelpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return (helpers as any).message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const password = (value: string, helpers: CustomHelpers) => {
  if (value.length < 8) {
    return (helpers as any).message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return (helpers as any).message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

export { objectId, password };
