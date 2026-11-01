
import { useEffect, useState } from "react";
import {
    Users,
    CalendarDays,
    ClipboardList,
    FileText,
    CheckCircle2,
    Clock3,
    RefreshCw,
    Database,
} from "lucide-react";

import api from "../services/api";

const metricCards = [
    {
        key: "totalPatients",
        label: "Registered Patients",
        note: "Total registered patients",
        icon: Users,
    },
    {
        key: "appointmentsToday",
        label: "Today's Appointments",
        note: "Scheduled for today",
        icon: CalendarDays,
    },
    {
        key: "pendingOrders",
        label: "Pending Orders",
        note: "Awaiting or undergoing examination",
        icon: ClipboardList,
    },
    {
        key: "completedExams",
        label: "Completed Exams",
        note: "Completed radiology examinations",
        icon: CheckCircle2,
    },
    {
        key: "pendingReports",
        label: "Pending Reports",
        note: "Awaiting finalization",
        icon: Clock3,
    },
    {
        key: "finalizedReports",
        label: "Finalized Reports",
        note: "Finalized radiology reports",
        icon: FileText,
    },
];

const statusStyles = {
    SCHEDULED: "bg-slate-100 text-slate-700",
    CONFIRMED: "bg-blue-50 text-blue-700",
    CHECKED_IN: "bg-amber-50 text-amber-700",
};

function formatDateTime(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isMounted = true;

        async function loadDashboard() {
            setIsLoading(true);
            setError("");

            try {
                const response = await api.get("/dashboard/summary");

                if (!response.data?.success || !response.data?.data) {
                    throw new Error("Invalid dashboard response received.");
                }

                if (isMounted) {
                    setSummary(response.data.data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Unable to load dashboard data."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            isMounted = false;
        };
    }, [reloadKey]);

    const statistics = summary?.statistics;
    const upcomingAppointments = summary?.upcomingAppointments || [];

    const connectionStatus = summary
        ? "Connected"
        : isLoading
            ? "Checking"
            : "Unavailable";

    return (
        <div className="space-y-7">
            {/* Page introduction */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-ink">
                        Overview
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Overview of your radiology operations.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setReloadKey((current) => current + 1)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        size={15}
                        className={isLoading ? "animate-spin" : ""}
                    />
                    {isLoading ? "Refreshing..." : "Refresh data"}
                </button>
            </section>

            {/* Error state */}
            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-4"
                >
                    <p className="text-sm font-medium text-red-800">
                        Dashboard data could not be loaded.
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                        {error}
                    </p>
                </div>
            )}

            {/* Statistics */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metricCards.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.key}
                            className="rounded-lg border border-line bg-surface p-5"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted">
                                    {item.label}
                                </p>

                                <Icon
                                    size={19}
                                    strokeWidth={1.8}
                                    className="text-slate-400"
                                />
                            </div>

                            <p
                                className="mt-5 text-3xl font-semibold tracking-tight text-ink"
                                aria-live="polite"
                            >
                                {isLoading
                                    ? "..."
                                    : statistics?.[item.key] ?? "-"}
                            </p>

                            <p className="mt-2 text-xs text-muted">
                                {item.note}
                            </p>
                        </div>
                    );
                })}
            </section>

            {/* Main dashboard content */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Upcoming appointments */}
                <div className="rounded-lg border border-line bg-surface p-5 xl:col-span-2">
                    <div className="mb-5">
                        <h3 className="text-base font-semibold text-ink">
                            Upcoming Appointments
                        </h3>

                        <p className="mt-1 text-sm text-muted">
                            Next scheduled patient appointments.
                        </p>
                    </div>

                    {isLoading ? (
                        <p className="py-8 text-center text-sm text-muted">
                            Loading appointments...
                        </p>
                    ) : upcomingAppointments.length === 0 ? (
                        <div className="rounded-md bg-slate-50 px-4 py-8 text-center">
                            <CalendarDays
                                size={25}
                                className="mx-auto mb-2 text-slate-400"
                            />

                            <p className="text-sm font-medium text-ink">
                                No upcoming appointments
                            </p>

                            <p className="mt-1 text-xs text-muted">
                                New scheduled appointments will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-line">
                            {upcomingAppointments.map((appointment) => {
                                const patient = appointment.patient;

                                return (
                                    <div
                                        key={appointment.id}
                                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-ink">
                                                {patient?.firstName}{" "}
                                                {patient?.lastName}
                                            </p>

                                            <p className="mt-1 text-xs text-muted">
                                                {patient?.patientNumber}
                                                {" · "}
                                                {appointment.modality}
                                            </p>

                                            <p className="mt-1 text-sm text-muted">
                                                {appointment.procedure}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                            <p className="text-sm font-medium text-ink">
                                                {formatDateTime(
                                                    appointment.scheduledAt
                                                )}
                                            </p>

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[appointment.status] ||
                                                    "bg-slate-100 text-slate-700"
                                                    }`}
                                            >
                                                {appointment.status?.replace(
                                                    /_/g,
                                                    " "
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Data connection */}
                <div className="rounded-lg border border-line bg-surface p-5">
                    <h3 className="text-base font-semibold text-ink">
                        Data Connection
                    </h3>

                    <p className="mt-1 text-sm text-muted">
                        Dashboard data source and connection status.
                    </p>

                    <div className="mt-6 space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Database
                                    size={17}
                                    className="text-slate-400"
                                />
                                <span className="text-sm text-ink">
                                    Dashboard API
                                </span>
                            </div>

                            <span
                                className={`text-xs font-medium ${summary
                                        ? "text-green-700"
                                        : error
                                            ? "text-red-700"
                                            : "text-amber-700"
                                    }`}
                            >
                                {connectionStatus}
                            </span>
                        </div>

                        <div>
                            <p className="text-sm text-ink">
                                Data source
                            </p>

                            <p className="mt-1 text-xs text-muted">
                                PostgreSQL through the RIS backend.
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-ink">
                                Last refreshed
                            </p>

                            <p className="mt-1 text-xs text-muted">
                                {summary?.generatedAt
                                    ? formatDateTime(summary.generatedAt)
                                    : "Not available"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-7 rounded-md bg-slate-50 p-3">
                        <p className="text-xs leading-5 text-muted">
                            Statistics are retrieved from actual RIS database
                            records. Use Refresh data to fetch the latest
                            information.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;
