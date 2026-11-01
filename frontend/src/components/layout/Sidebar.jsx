
import { NavLink } from "react-router";
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    ClipboardList,
    FileText,
    UserRoundCog,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navigation = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Patients",
        path: "/patients",
        icon: Users,
    },
    {
        label: "Appointments",
        path: "/appointments",
        icon: CalendarDays,
    },
    {
        label: "Radiology Worklist",
        path: "/worklist",
        icon: ClipboardList,
    },
    {
        label: "Radiology Reports",
        path: "/reports",
        icon: FileText,
    },
    {
        label: "Staff Management",
        path: "/staff",
        icon: UserRoundCog,
    },
];

function Sidebar() {
    const { user } = useAuth();

    const visibleNavigation = navigation.filter(
        (item) =>
            item.path !== "/staff" || user?.role === "ADMIN"
    );

    return (
        <aside className="flex w-full shrink-0 flex-col border-b border-line bg-surface md:min-h-screen md:w-64 md:border-b-0 md:border-r">
            {/* Brand */}
            <div className="flex h-72px items-center gap-3 border-b border-line px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                    R
                </div>

                <div>
                    <h1 className="text-base font-semibold tracking-tight text-ink">
                        RIS Portal
                    </h1>
                    <p className="text-xs text-muted">
                        Radiology Information System
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-wrap gap-1 p-3 md:flex-1 md:flex-col md:flex-nowrap">
                <p className="hidden px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted md:block">
                    Workspace
                </p>

                {visibleNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                    ? "bg-blue-50 text-primary"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                                }`
                            }
                        >
                            <Icon size={18} strokeWidth={1.8} />

                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="hidden border-t border-line p-4 md:block">
                <p className="text-xs font-medium text-ink">
                    RIS MVP
                </p>
                <p className="mt-1 text-xs text-muted">
                    Local development version
                </p>
            </div>
        </aside>
    );
}

export default Sidebar;
