import { Musing } from '../types';
import { INITIAL_MUSINGS } from '../constants';

const MusingStorageKey = 'zenblog_local_musings';

export const getMusings = (): Musing[] => {
  const localJson = localStorage.getItem(MusingStorageKey);
  const localMusings: Musing[] = localJson ? JSON.parse(localJson) : [];
  const allMusings = [...localMusings, ...INITIAL_MUSINGS];
  return allMusings.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
};

export const getMusingById = (id: string): Musing | undefined => {
  return getMusings().find(m => m.id === id);
};
