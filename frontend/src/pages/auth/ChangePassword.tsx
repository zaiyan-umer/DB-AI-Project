    import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "../../components/ui/logo";
import type { changePasswordData } from '../../utils/schema/auth.schema';
import { useChangePassword } from "../../hooks/useAuth";
import { type ReactNode } from "react";

const ChangePassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const { register, handleSubmit, errors, apiError, isPending, mutate: resetPassword } = useChangePassword(token);

    return (
        <div className="h-screen w-screen flex bg-gray-50 overflow-hidden font-sans">
            
            {/* Left Graphic - Sophisticated Minimalist */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gray-600 blur-[100px]" />
                </div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgwem0yMCAwdjIwaDIwdjIweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30 z-0"></div>
                
                <div className="relative z-10 p-12 max-w-xl text-white">
                    <h2 className="text-4xl font-light tracking-wide mb-6">Secure Your Account.</h2>
                    <p className="text-gray-400 text-lg font-light leading-relaxed">
                        Update your credentials to maintain strict security over your personalized learning data.
                    </p>
                </div>
            </div>

            {/* Right Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative z-10 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.05)]">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10">
                        <Logo />
                        <h2 className="text-3xl font-semibold text-gray-900 tracking-wide mt-8 mb-2">
                            Update Password
                        </h2>
                        <p className="text-gray-500 text-sm tracking-wide">
                            Please enter your new password below.
                        </p>
                    </div>

                    <Form
                        register={register}
                        handleSubmit={handleSubmit}
                        onSubmit={(data: changePasswordData) => resetPassword(data)}
                        errors={errors}
                        isPending={isPending}
                        apiError={apiError}
                    />

                    <div className="mt-8 text-center text-sm">
                        <p className="text-gray-500">
                            Remember your password?{" "}
                            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors duration-200">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default ChangePassword

// Localized Input Component
const AuthInput = ({ 
    label, icon, error, ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: ReactNode, error?: string }) => (
    <div className="w-full">
        <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
            {label}
        </label>
        <div className="relative">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    {icon}
                </div>
            )}
            <input
                {...props}
                className={`
                    block w-full rounded-xl border ${error ? 'border-red-300' : 'border-gray-200'} 
                    bg-gray-50 px-4 py-3 ${icon ? 'pl-11' : ''} text-gray-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white
                    transition-all duration-200 sm:text-sm
                `}
            />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
);

// Localized Button Component
const AuthButton = ({ children, isPending, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isPending?: boolean }) => (
    <button
        {...props}
        disabled={isPending || props.disabled}
        className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* API Error Display */}
            {apiError && (
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-sm text-red-600">
                    {apiError.response?.data?.message || 'Update failed. Please try again.'}
                </div>
            )}

            <div className="space-y-4">
                <AuthInput
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message}
                    required
                />

                <AuthInput
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.confirmPassword?.message}
                    required
                />
            </div>

            <div className="pt-2">
                <AuthButton type="submit" isPending={isPending}>
                    {isPending ? 'Updating...' : 'Update Password'}
                </AuthButton>
            </div>
        </form>
    )
}