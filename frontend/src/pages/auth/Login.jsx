
import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            await login(email, password);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to sign in. Please try again."
            );
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
            <div className="w-full max-w-[420px]">

                {/* Brand */}
                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
                        R
                    </div>

                    <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
                        RIS Portal
                    </h1>

                    <p className="mt-1 text-sm text-muted">
                        Radiology Information System
                    </p>
                </div>

                {/* Login form */}
                <div className="rounded-xl border border-line bg-surface p-7 shadow-sm">
                    <div className="mb-7">
                        <h2 className="text-xl font-semibold text-ink">
                            Welcome back
                        </h2>

                        <p className="mt-1 text-sm text-muted">
                            Sign in to access your workspace.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Error message */}
                        {error && (
                            <div
                                role="alert"
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-ink"
                            >
                                Email address
                            </label>

                            <div className="relative">
                                <Mail
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="username"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="name@hospital.com"
                                    required
                                    maxLength={254}
                                    className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-ink"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="Enter your password"
                                    required
                                    maxLength={200}
                                    className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-11 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((current) => !current)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-muted">
                    Authorized staff access only.
                </p>

                <p className="mt-2 text-center text-xs text-slate-400">
                    RIS MVP · Development environment
                </p>
            </div>
        </main>
    );
}

export default Login;
