import { Link } from "react-router-dom";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { motion } from "motion/react";
import { useSignup } from "../hooks/useAuth";
import { useForm } from 'react-hook-form'

export type FormFields = {
    firstname: string,
    lastname: string,
    username: string,
    email: string,
    password: string,
    confirmPassword: string
}

export default function SignupPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormFields>({
        mode: 'onBlur',
    })
    const { mutate: signup, isPending, error } = useSignup()

    // Extract validation errors from mutation error
    const apiError = (error as any)?.type !== 'validation' ? error : null;

    return (
        <div className="h-screen w-screen flex overflow-hidden">

            {/* Left Illustration */}
            <div className="hidden lg:flex w-1/2 bg-linear-to-br from-[#f093fb] to-[#f5576c] items-center justify-center p-6 relative">
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L2c+PC9zdmc+')]" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md text-center text-white"
                >
                    <img
                        src="https://images.unsplash.com/photo-1759977064094-840dfc694bee?q=80&w=1080"
                        className="rounded-xl shadow-xl"
                    />
                </motion.div>
            </div>

            {/* Right Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-lg"
                >
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-linear-to-r from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>

                        <h1 className="text-xl font-bold bg-linear-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                            StudySync AI
                        </h1>
                    </div>

                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Create your account
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Start your journey to smarter learning
                        </p>
                    </div>
                    <Form 
                        register={register}
                        handleSubmit={handleSubmit}
                        onSubmit={(data) => signup(data)}
                        errors={errors}
                        isPending={isPending}
                        apiError={apiError}
                    />

                    <div className="mt-3 text-center text-sm">
                        <p className="text-gray-600">
                            Already have an account?{" "}
                            <Link to="/" className="text-[#667eea] font-semibold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

const Form = ({ 
    register,
    handleSubmit,
    onSubmit,
    errors, 
    isPending, 
    apiError 
}: { 
    register: any;
    handleSubmit: any;
    onSubmit: any;
    errors: any;
    isPending?: boolean;
    apiError?: any;
}) => {
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-black">

            {/* API Error Display */}
            {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {apiError.response?.data?.message || 'Signup failed. Please try again.'}
                </div>
            )}

            {/* first + last row */}
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="First Name"
                    placeholder="John"
                    {...register('firstname', { required: 'First name is required' })}
                    icon={<User className="w-4 h-4" />}
                    error={errors.firstname?.message}
                    required
                />

                <Input
                    label="Last Name"
                    placeholder="Doe"
                    {...register('lastname', { required: 'Last name is required' })}
                    icon={<User className="w-4 h-4" />}
                    error={errors.lastname?.message}
                    required
                />
            </div>

            <div className="grid grid-cols-1 gap-3">
                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Invalid email address'
                        }
                    })}
                    icon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
                    required
                />
                <Input
                    label="Username"
                    placeholder="johndoe"
                    {...register('username', { required: 'Username is required' })}
                    icon={<User className="w-4 h-4" />}
                    error={errors.username?.message}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                        }
                    })}
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message}
                    required
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword', { required: 'Please confirm password' })}
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.confirmPassword?.message}
                    required
                />
            </div>

            <div className="flex items-center gap-2 text-sm pt-1">
                <input type="checkbox" required />
                <span className="text-gray-600">
                    I agree to the Terms and Privacy Policy
                </span>
            </div>

            <Button type="submit" fullWidth disabled={isPending}>
                {isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
        </form>
    )
}
