import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Logo } from "../../components/ui/logo";
import type { changePasswordData } from '../../utils/schema/auth.schema';
import { useChangePassword } from "../../hooks/useAuth";

const ChangePassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const { register, handleSubmit, errors, apiError, isPending, mutate: resetPassword } = useChangePassword(token);

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white px-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <Logo />

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
                    <p className="text-gray-500 text-sm mt-1">Enter your email and we will send you a reset link.</p>
                </div>

                <Form
                    register={register}
                    handleSubmit={handleSubmit}
                    onSubmit={(data: changePasswordData) => resetPassword(data)}
                    errors={errors}
                    isPending={isPending}
                    apiError={apiError}
                />

                <div className="mt-4 text-center text-sm">
                    <Link to="/login" className="text-[#667eea] font-semibold hover:underline">
                        Back to Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}

export default ChangePassword

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-black">

            {/* API Error Display */}
            {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {apiError.response?.data?.message || 'Login failed. Please try again.'}
                </div>
            )}


            <div className="grid grid-cols-1 gap-3">
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

            <Button type="submit" fullWidth disabled={isPending}>
                {isPending ? 'Updating...' : 'Update Password'}
            </Button>
        </form>
    )
}