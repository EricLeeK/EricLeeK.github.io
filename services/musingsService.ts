import { Musing } from '../types';
import { INITIAL_MUSINGS } from '../constants';

const MusingStorageKey = 'zenblog_local_musings';

export const getMusings = (): Musing[] => {
  const localJson = localStorage.getItem(MusingStorageKey);
  const localMusings: Musing[] = localJson ? JSON.parse(localJson) : [];
  return [...localMusings, ...INITIAL_MUSINGS];
};

export const getMusingById = (id: string): Musing | undefined => {
  return getMusings().find(m => m.id === id);
};
