import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  email: string;
  username: string;
  chips?: number;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean; //true while we are trying to restore the session
  hasHydrated: boolean;   // true once Zustand has finished reading localStorage
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  setAccessToken: (access: string) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,  //starts true coz we dont know if the user is logged in
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => set({ accessToken: null, refreshToken: null }),
    }),
    {
      name: "poker-auth", //local storage key name
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }) as AuthStore,

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
