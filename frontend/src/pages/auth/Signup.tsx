import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Logo } from "@/components/ui/logo";
import { useSignup } from "@/hooks/useAuth";
import type { SignupFormData } from "@/utils/schema/auth.schema";
import { Lock, Mail, User } from "lucide-react";
import { motion } from "motion/react";
import type { FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { Link } from "react-router-dom";


export default function SignupPage() {
    const { mutate: signup, isPending, apiError, register, handleSubmit, errors } = useSignup()

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
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-lg"
                >

                    <Logo />

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
                        onSubmit={(data: SignupFormData) => signup(data)}
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
    register: UseFormRegister<SignupFormData>;
    handleSubmit: UseFormHandleSubmit<SignupFormData>;
    onSubmit: SubmitHandler<SignupFormData>;
    errors: FieldErrors<SignupFormData>;
    isPending?: boolean;
    apiError?: string | null;
}) => {
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 text-black">

            {/* API Error Display */}
            {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {apiError || 'Signup failed. Please try again.'}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="First Name"
                    placeholder="John"
                    {...register('firstname')}
                    icon={<User className="w-4 h-4" />}
                    error={errors.firstname?.message}
                    required
                />

                <Input
                    label="Last Name"
                    placeholder="Doe"
                    {...register('lastname')}
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
                    {...register('email')}
                    icon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
                    required
                />
                <Input
                    label="Username"
                    placeholder="johndoe"
                    {...register('username')}
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
                    {...register('password')}
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message}
                    required
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
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
