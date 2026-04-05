import uuid from 'react-native-uuid';

/** Gera um UUID v4 garantido como string. */
export function generateId(): string {
  return uuid.v4() as string;
}
