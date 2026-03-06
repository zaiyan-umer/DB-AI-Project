import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'
import { signupValidation } from '../utils/input-validation/signup.validation'

interface SignupFormData {
    firstname: string
    lastname: string
    username: string
    email: string
    password: string
    confirmPassword: string
}

interface SignupResponse {
    message: string
    newUser: {
        id: string
        email: string
        firstname: string
        lastname: string
        username?: string
    }
}

export function useSignup() {
    const navigate = useNavigate()

    return useMutation({
        mutationFn: async (formData: SignupFormData) => {
            // Validate form data
            const validationResult = signupValidation(formData)

            if (!validationResult.valid) {
                // Throw structured validation error
                throw {
                    type: 'validation',
                    errors: validationResult.errors,
                }
            }

            // Make API request
            const response = await api.post<SignupResponse>('/auth/register', {
                firstname: formData.firstname,
                lastname: formData.lastname,
                username: formData.username,
                email: formData.email,
                password: formData.password,
            })

            return response.data
        },
        onSuccess: (data) => {
            console.log('User registered successfully:', data)
            navigate('/dashboard')
        },
        onError: (error: any) => {
            console.error('Signup error:', error.response?.data || error.message)
        },
    })
}

export function useLogin() {
    const navigate = useNavigate()

    return useMutation({
        mutationFn: async (credentials: { email: string; password: string }) => {
            const response = await api.post('/auth/login', credentials)
            return response.data
        },
        onSuccess: (data) => {
            // Store auth token if returned
            if (data.token) {
                localStorage.setItem('authToken', data.token)
            }
            navigate('/dashboard')
        },
        onError: (error: any) => {
            console.error('Login error:', error.response?.data || error.message)
        },
    })
}

export function useLogout() {
    const navigate = useNavigate()

    return useMutation({
        mutationFn: async () => {
            await api.get('/auth/logout')
        },
        onSuccess: () => {
            localStorage.removeItem('authToken')
            navigate('/')
        },
    })
}