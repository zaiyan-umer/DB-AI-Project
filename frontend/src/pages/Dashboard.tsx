import { LogOut, User } from "lucide-react";
import { Button } from "../components/Button";
import { useLogout } from "../hooks/useAuth";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function Dashboard() {
    const { data: user } = useCurrentUser();
    const { mutate: logout, isPending } = useLogout();

    return (
        <div className="h-screen w-screen bg-linear-to-br from-gray-50 to-gray-100">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">StudySync AI</h1>
                    <Button 
                        onClick={() => logout()} 
                        disabled={isPending}
                        className="flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        {isPending ? "Logging out..." : "Logout"}
                    </Button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-linear-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                Welcome, {user?.firstName || user?.username}!
                            </h2>
                            <p className="text-gray-600">{user?.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="p-6 bg-linear-to-br from-[#667eea]/10 to-[#764ba2]/10 rounded-lg border border-[#667eea]/20">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Information</h3>
                            <dl className="space-y-2 text-sm">
                                <div>
                                    <dt className="font-medium text-gray-700">ID</dt>
                                    <dd className="text-gray-600">{user?.id}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-gray-700">Email</dt>
                                    <dd className="text-gray-600">{user?.email}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-gray-700">Username</dt>
                                    <dd className="text-gray-600">{user?.username || "Not set"}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="p-6 bg-linear-to-br from-[#f093fb]/10 to-[#f5576c]/10 rounded-lg border border-[#f093fb]/20">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Status</h3>
                            <p className="text-gray-600 mb-4">Your account is active and authenticated.</p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                Authenticated
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
