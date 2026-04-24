import { customAlphabet } from 'nanoid/non-secure';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeRoomCode = customAlphabet(ROOM_CODE_ALPHABET);

export const generateCode = (length = 4) => {
  return makeRoomCode(length);
};