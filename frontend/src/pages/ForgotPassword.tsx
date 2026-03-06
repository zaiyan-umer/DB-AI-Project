import { Mail, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useForgotPassword } from "../hooks/useAuth";

export default function ForgotPasswordPage() {
    const { mutate: sendEmail, register, errors, apiError, isPending, handleSubmit } = useForgotPassword();
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;

        const interval = setInterval(() => {
            setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [cooldown]);

    const isCoolingDown = cooldown > 0;

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-white px-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-linear-to-r from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-linear-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                        StudySync AI
                    </h1>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
                    <p className="text-gray-500 text-sm mt-1">Enter your email and we will send you a reset link.</p>
                </div>

                <form
                    onSubmit={handleSubmit((data) =>
                        sendEmail(data, {
                            onSuccess: () => {
                                setCooldown(30);
                            },
                        })
                    )}
                    className="space-y-4 text-black"
                >
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        icon={<Mail className="w-4 h-4" />}
                        {...register("email")}
                        error={errors.email?.message}
                        required
                        disabled={isCoolingDown}
                    />

                    {apiError && <p className="text-sm text-red-500">{apiError}</p>}

                    {isCoolingDown && (
                        <p className="text-sm text-gray-600">
                            If you did not receive an email, you can retry in {cooldown}s.
                        </p>
                    )}

                    <Button type="submit" fullWidth disabled={isPending || isCoolingDown}>
                        {isPending ? "Sending..." : isCoolingDown ? `Retry` : "Send reset link"}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <Link to="/login" className="text-[#667eea] font-semibold hover:underline">
                        Back to Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
