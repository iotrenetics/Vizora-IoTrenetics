import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isLoggedIn:   boolean;
  username:     string;
  displayName:  string;
  login:        (username: string) => void;
  logout:       () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn:  false,
      username:    '',
      displayName: '',

      login: (username: string) =>
        set({
          isLoggedIn:  true,
          username,
          /* Capitalise first letter as display name */
          displayName: username.charAt(0).toUpperCase() + username.slice(1),
        }),

      logout: () =>
        set({ isLoggedIn: false, username: '', displayName: '' }),
    }),
    {
      name: 'vizora-auth',   // localStorage key
    }
  )
);