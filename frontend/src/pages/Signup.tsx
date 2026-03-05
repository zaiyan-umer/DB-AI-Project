import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { motion } from "motion/react";
import { signupValidation } from "../utils/input-validation/signup.validation";

export default function SignupPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();

        const validationResult = signupValidation(formData);

        if (!validationResult.valid) {
            setErrors(validationResult.errors);
            return;
        }

        // api req
        // use tanstack query

        setErrors({});
        navigate('/dashboard');
    };

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
                    <Form formData={formData} setFormData={setFormData} handleSignup={handleSignup} errors={errors} />

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

const Form = ({ formData, setFormData, handleSignup, errors }: { formData: any; setFormData: any; handleSignup: any; errors: any }) => {
    return (
        <form onSubmit={handleSignup} className="space-y-3 text-black">

            {/* first + last row */}
            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="First Name"
                    placeholder="John"
                    value={formData.firstname}
                    onChange={(e) =>
                        setFormData({ ...formData, firstname: e.target.value })
                    }
                    icon={<User className="w-4 h-4" />}
                    error={errors.firstname}
                    required
                />

                <Input
                    label="Last Name"
                    placeholder="Doe"
                    value={formData.lastname}
                    onChange={(e) =>
                        setFormData({ ...formData, lastname: e.target.value })
                    }
                    icon={<User className="w-4 h-4" />}
                    error={errors.lastname}
                    required
                />
            </div>

            <div className="grid grid-cols-1 gap-3">
                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                    icon={<Mail className="w-4 h-4" />}
                    error={errors.email}
                    required
                />
                <Input
                    label="Username"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                    }
                    icon={<User className="w-4 h-4" />}
                    error={errors.username}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                    }
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password}
                    required
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.confirmPassword}
                    required
                />
            </div>

            <div className="flex items-center gap-2 text-sm pt-1">
                <input type="checkbox" required />
                <span className="text-gray-600">
                    I agree to the Terms and Privacy Policy
                </span>
            </div>

            <Button type="submit" fullWidth>
                Create Account
            </Button>
        </form>
    )
}
