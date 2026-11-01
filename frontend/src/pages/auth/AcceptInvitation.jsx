
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import api from "../../services/api";

function AcceptInvitation() {
    const navigate = useNavigate();

    const [token] = useState(
        () => new URLSearchParams(window.location.search).get("token") || ""
    );

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!token) {
            setError("Invalid invitation link. Please contact your administrator.");
            return;
        }

        if (password.length < 12) {
            setError("Your password must contain at least 12 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/accept-invitation", {
                token,
                password,
            });

            // Remove the accepted secret token from the address bar.
            window.history.replaceState(
                {},
                document.title,
                "/accept-invitation"
            );

            setSuccess(true);
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to accept invitation. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
                <div className="w-full max-w-[420px] rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
                        <ShieldCheck size={25} />
                    </div>

                    <h1 className="mt-5 text-xl font-semibold text-ink">
                        Account activated
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-muted">
                        Your staff account has been activated successfully.
                        You can now sign in using your email and new password.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/login", { replace: true })}
                        className="mt-7 h-11 w-full rounded-md bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
                    >
                        Continue to login
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
            <div className="w-full max-w-[420px]">

                {/* Brand */}
                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
                        R
                    </div>

                    <h1 className="mt-4 text-xl font-semibold text-ink">
                        RIS Portal
                    </h1>

                    <p className="mt-1 text-sm text-muted">
                        Radiology Information System
                    </p>
                </div>

                {/* Invitation form */}
                <div className="rounded-xl border border-line bg-surface p-7 shadow-sm">
                    <h2 className="text-xl font-semibold text-ink">
                        Activate your account
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-muted">
                        Create a secure password to activate your staff account.
                    </p>

                    {!token && (
                        <div
                            role="alert"
                            className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            Invitation token is missing. Please use
                            the complete invitation link.
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-ink"
                            >
                                New password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    minLength={12}
                                    maxLength={200}
                                    required
                                    placeholder="At least 12 characters"
                                    className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-2 block text-sm font-medium text-ink"
                            >
                                Confirm password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    minLength={12}
                                    maxLength={200}
                                    required
                                    placeholder="Re-enter your password"
                                    className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <p className="text-xs leading-5 text-muted">
                            Your password must contain at least 12
                            characters. Your administrator has already
                            assigned your staff role.
                        </p>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Activating account..."
                                : "Activate account"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted">
                        Already activated?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-primary hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-muted">
                    Authorized staff access only.
                </p>
            </div>
        </main>
    );
}

export default AcceptInvitation;
