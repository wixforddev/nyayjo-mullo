/**
 * Create an object composed of the picked object properties
 * @param object - The source object
 * @param keys - Array of keys to pick
 * @returns A new object with only the picked keys
 */
const pick = <T extends Record<string, any>, K extends keyof T>(object: T | undefined, keys: K[]): Pick<T, K> => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {} as Pick<T, K>);
};

export default pick;
