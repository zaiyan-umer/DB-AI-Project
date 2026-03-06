import type { User } from '../utils/schema/user.schema'
import { create } from 'zustand'

type AuthState = {
    user: User | null
    loading: boolean
    setUser: (user: User | null) => void
}

const userStore = create<AuthState>(set => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false })
}))


export const useUser = () => userStore(state => state.user)
export const useSetUser = () => userStore(state => state.setUser)
export const useLoading = () => userStore(state => state.loading)