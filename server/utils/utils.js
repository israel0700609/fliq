import { nanoid } from 'nanoid/non-secure';


export const generateCode = (length = 4) => {
  return nanoid(length);
}