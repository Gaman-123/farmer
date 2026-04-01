import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DummyUser {
  id: string;
  role: 'farmer' | 'buyer';
  name: string;
  location: string;
}

interface FarmerState {
  user: DummyUser | null;
  setUser: (user: DummyUser | null) => void;
  clearUser: () => void;
}

export const useFarmerStore = create<FarmerState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'ekrishi-dummy-user',
    }
  )
);
