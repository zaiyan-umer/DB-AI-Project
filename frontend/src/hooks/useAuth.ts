import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'
import { signupSchema, type SignupFormData } from '../utils/schema/signup.schema'
import { loginSchema, type LoginFormData } from '../utils/schema/login.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { useSetUser } from '../store/user.store'

// ---- Types ----------------------------------------------------------------

interface SignupResponse {
    message: string
    user: {
        id: string
        email: string
        firstname?: string
        lastname?: string
        username?: string
    }
}

interface ApiErrorResponse {
    message: string
}

// ---- API calls ------------------------------------------------------------

const createUser = async (formData: SignupFormData): Promise<SignupResponse> => {
    const res = await api.post<SignupResponse>('/auth/register', {
        firstname: formData.firstname,
        lastname: formData.lastname,
        username: formData.username,
        email: formData.email,
        password: formData.password,
    })
    return res.data
}

const loginUser = async (formData: LoginFormData) => {
    const res = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
    })
    return res.data
}

// ---- Hooks ----------------------------------------------------------------

export function useSignup() {
    const navigate = useNavigate()

    const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
        mode: 'onBlur',
        resolver: zodResolver(signupSchema),
    })

    const { error, isPending, mutate } = useMutation<
        SignupResponse,
        AxiosError<ApiErrorResponse>,
        SignupFormData
    >({
        mutationFn: createUser,
        onSuccess: (data) => {
            toast.success("Registration successful!")
            console.log('User registered successfully:', data)
            navigate('/dashboard')
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message ?? error.message ?? "Registration failed. Please try again."
            console.error('Signup error:', errorMessage)
            toast.error(errorMessage)
        },
    })

    const apiError = error?.response?.data?.message ?? error?.message ?? null

    return { apiError, isPending, mutate, register, handleSubmit, errors }
}

export function useLogin() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const setUser = useSetUser()

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        mode: 'onBlur',
        resolver: zodResolver(loginSchema),
    })

    const { error, isPending, mutate } = useMutation<
        SignupResponse,
        AxiosError<ApiErrorResponse>,
        LoginFormData
    >({
        mutationFn: loginUser,
        onSuccess: (data) => {
            queryClient.clear()

            toast.success("Login successful!")
            setUser(data.user)
            console.log('User logged in successfully:', data)
            navigate('/dashboard')
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message ?? error.message ?? "Login failed. Please try again."
            console.error('Login error:', errorMessage)
            toast.error(errorMessage)
        },
    })

    const apiError = error?.response?.data?.message ?? error?.message ?? null

    return { apiError, isPending, mutate, register, handleSubmit, errors }
}

export function useLogout() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const setUser = useSetUser()

    return useMutation({
        mutationFn: async () => {
            await api.post('/auth/logout')
        },
        onSuccess: () => {
            queryClient.clear() // clear all cached queries on logout
            toast.success("Logged out successfully!")
            setUser(null)
            navigate('/')
        },
        onError: (error) => {
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Logout failed. Please try again."
            console.error('Logout error:', errorMessage)
            toast.error(errorMessage)
        },
    })
}