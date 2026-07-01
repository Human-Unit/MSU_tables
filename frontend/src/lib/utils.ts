import {type ClassValue, clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPathValue(source: Record<string, any>, path: string) {
  return path.split('.').reduce<any>((value, key) => {
    if (value == null) {
      return '';
    }
    return value[key];
  }, source);
}

