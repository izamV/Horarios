import { createStore as createZustandStore, type StateCreator } from 'zustand';

export type { StateCreator } from 'zustand';
export type StoreApi<T> = ReturnType<typeof createZustandStore<T>>;

export const createStore = <T>(creator: StateCreator<T>) => createZustandStore(creator);
