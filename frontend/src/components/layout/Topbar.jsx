
import { LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";

function Topbar({ title, description }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <header className="flex min-h-[72px] items-center justify-between border-b border-line bg-surface px-5 md:px-8">
            <div>
                <h2 className="text-lg font-semibold text-ink">
                    {title}
                </h2>

                <p className="mt-0.5 text-xs text-muted">
                    {description}
                </p>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
                <div className="flex items-center gap-2 border-l border-line pl-3 md:pl-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound size={18} />
                    </div>

                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-ink">
                            {user?.name || "Staff member"}
                        </p>

                        <p className="text-xs capitalize text-muted">
                            {user?.role?.toLowerCase() || "Staff"}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
}

export default Topbar;
