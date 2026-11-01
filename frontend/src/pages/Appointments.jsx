
import { useEffect, useState } from "react";
import {
    CalendarDays,
    CalendarPlus,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Pencil,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppointmentForm from "../components/appointments/AppointmentForm";

const modalities = [
    "XRAY",
    "CT",
    "MRI",
    "ULTRASOUND",
    "MAMMOGRAPHY",
    "PET_CT",
    "OTHER",
];

const statuses = [
    "SCHEDULED",
    "CONFIRMED",
    "CHECKED_IN",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
];

const allowedTransitions = {
    SCHEDULED: ["CONFIRMED", "CHECKED_IN", "CANCELLED", "NO_SHOW"],
    CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
    CHECKED_IN: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};

const statusStyles = {
    SCHEDULED: "bg-slate-100 text-slate-700",
    CONFIRMED: "bg-blue-50 text-blue-700",
    CHECKED_IN: "bg-amber-50 text-amber-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
    NO_SHOW: "bg-orange-50 text-orange-700",
};

function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

function formatStatus(status) {
    return status?.replace(/_/g, " ") || "—";
}

function localDateStart(value) {
    return value
        ? new Date(`${value}T00:00:00`).toISOString()
        : undefined;
}

function localDateEnd(value) {
    return value
        ? new Date(`${value}T23:59:59.999`).toISOString()
        : undefined;
}

function Appointments() {
    const { user } = useAuth();

    const canManageAppointments =
        user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

    const canUpdateStatus = [
        "ADMIN",
        "RECEPTIONIST",
        "TECHNICIAN",
    ].includes(user?.role);

    const [appointments, setAppointments] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const [page, setPage] = useState(1);
    const [modality, setModality] = useState("");
    const [status, setStatus] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [appliedFilters, setAppliedFilters] = useState({
        modality: "",
        status: "",
        from: "",
        to: "",
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [updatingId, setUpdatingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function loadAppointments() {
            setIsLoading(true);
            setError("");

            try {
                const params = {
                    page,
                    limit: 20,
                    ...(appliedFilters.modality
                        ? { modality: appliedFilters.modality }
                        : {}),
                    ...(appliedFilters.status
                        ? { status: appliedFilters.status }
                        : {}),
                    ...(appliedFilters.from
                        ? { from: appliedFilters.from }
                        : {}),
                    ...(appliedFilters.to
                        ? { to: appliedFilters.to }
                        : {}),
                };

                const response = await api.get("/appointments", {
                    params,
                });

                if (isMounted) {
                    setAppointments(response.data.data || []);
                    setPagination(response.data.pagination);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load appointments."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadAppointments();

        return () => {
            isMounted = false;
        };
    }, [page, appliedFilters, reloadKey]);

    function applyFilters(event) {
        event.preventDefault();

        if (fromDate && toDate && fromDate > toDate) {
            setError("The start date cannot be later than the end date.");
            return;
        }

        setPage(1);
        setAppliedFilters({
            modality,
            status,
            from: localDateStart(fromDate),
            to: localDateEnd(toDate),
        });
    }

    function clearFilters() {
        setModality("");
        setStatus("");
        setFromDate("");
        setToDate("");
        setPage(1);

        setAppliedFilters({
            modality: "",
            status: "",
            from: "",
            to: "",
        });
    }

    function refreshAppointments() {
        setReloadKey((key) => key + 1);
    }

    function closeForm() {
        setShowForm(false);
        setSelectedAppointment(null);
    }

    async function changeAppointmentStatus(appointmentId, newStatus) {
        setActionError("");
        setUpdatingId(appointmentId);

        try {
            await api.patch(
                `/appointments/${appointmentId}/status`,
                { status: newStatus }
            );

            refreshAppointments();
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                "Unable to update appointment status."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    function openEditForm(appointment) {
        setSelectedAppointment(appointment);
        setShowForm(true);
    }

    return (
        <div className="space-y-6">
            {/* Heading */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-ink">
                        Appointment Management
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Schedule and manage radiology appointments.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={refreshAppointments}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={15}
                            className={isLoading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    {canManageAppointments && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedAppointment(null);
                                setShowForm(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            <CalendarPlus size={17} />
                            Schedule Appointment
                        </button>
                    )}
                </div>
            </section>

            {/* Summary */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Total Appointments
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                        {pagination.total ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        Matching appointment records
                    </p>
                </div>

                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Scheduled
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                        {appointments.filter((item) =>
                            item.status === "SCHEDULED"
                        ).length}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        On the current page
                    </p>
                </div>

                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Completed
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                        {appointments.filter((item) =>
                            item.status === "COMPLETED"
                        ).length}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        On the current page
                    </p>
                </div>
            </section>

            {/* Filters */}
            <section className="rounded-lg border border-line bg-surface p-5">
                <form
                    onSubmit={applyFilters}
                    className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-5"
                >
                    <div>
                        <label
                            htmlFor="appointmentFrom"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            From Date
                        </label>
                        <input
                            id="appointmentFrom"
                            type="date"
                            value={fromDate}
                            onChange={(event) =>
                                setFromDate(event.target.value)
                            }
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="appointmentTo"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            To Date
                        </label>
                        <input
                            id="appointmentTo"
                            type="date"
                            value={toDate}
                            onChange={(event) =>
                                setToDate(event.target.value)
                            }
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="appointmentModality"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Modality
                        </label>
                        <select
                            id="appointmentModality"
                            value={modality}
                            onChange={(event) =>
                                setModality(event.target.value)
                            }
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        >
                            <option value="">All Modalities</option>
                            {modalities.map((item) => (
                                <option key={item} value={item}>
                                    {item.replace("_", " ")}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="appointmentStatus"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Status
                        </label>
                        <select
                            id="appointmentStatus"
                            value={status}
                            onChange={(event) =>
                                setStatus(event.target.value)
                            }
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        >
                            <option value="">All Statuses</option>
                            {statuses.map((item) => (
                                <option key={item} value={item}>
                                    {formatStatus(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            Apply
                        </button>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-md border border-line px-3 py-2.5 text-sm font-medium text-ink hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </section>

            {/* Errors */}
            {(error || actionError) && (
                <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error || actionError}
                </div>
            )}

            {/* Appointment records */}
            <section className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h3 className="text-base font-semibold text-ink">
                        Appointment Records
                    </h3>

                    <span className="text-xs text-muted">
                        {pagination.total ?? 0} total records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-line">
                                {[
                                    "Date & Time",
                                    "Patient",
                                    "Procedure",
                                    "Modality",
                                    "Location",
                                    "Status",
                                    "Actions",
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-line">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-12 text-center text-sm text-muted"
                                    >
                                        Loading appointments...
                                    </td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-14">
                                        <div className="text-center">
                                            <CalendarDays
                                                size={28}
                                                className="mx-auto mb-3 text-slate-400"
                                            />
                                            <p className="text-sm font-medium text-ink">
                                                No appointments found
                                            </p>
                                            <p className="mt-1 text-xs text-muted">
                                                Schedule an appointment or change the filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((appointment) => {
                                    const transitions =
                                        allowedTransitions[appointment.status] || [];

                                    const canReschedule =
                                        canManageAppointments &&
                                        !["COMPLETED", "CANCELLED", "NO_SHOW"]
                                            .includes(appointment.status);

                                    return (
                                        <tr
                                            key={appointment.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-ink">
                                                {formatDateTime(
                                                    appointment.scheduledAt
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-ink">
                                                    {appointment.patient?.firstName}{" "}
                                                    {appointment.patient?.lastName}
                                                </p>
                                                <p className="mt-1 text-xs text-muted">
                                                    {appointment.patient?.patientNumber}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-ink">
                                                {appointment.procedure}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                                {appointment.modality}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-muted">
                                                {appointment.location || "—"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[appointment.status] ||
                                                        "bg-slate-100 text-slate-700"
                                                        }`}
                                                >
                                                    {formatStatus(
                                                        appointment.status
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    {canReschedule && (
                                                        <button
                                                            type="button"
                                                            title="Reschedule appointment"
                                                            onClick={() =>
                                                                openEditForm(appointment)
                                                            }
                                                            className="rounded-md border border-line p-2 text-muted hover:bg-slate-100 hover:text-ink"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}

                                                    {canUpdateStatus &&
                                                        transitions.length > 0 && (
                                                            <select
                                                                value=""
                                                                disabled={
                                                                    updatingId === appointment.id
                                                                }
                                                                onChange={(event) =>
                                                                    changeAppointmentStatus(
                                                                        appointment.id,
                                                                        event.target.value
                                                                    )
                                                                }
                                                                className="max-w-[145px] rounded-md border border-line bg-white px-2 py-2 text-xs text-ink outline-none focus:border-primary disabled:opacity-50"
                                                                aria-label={`Update status for ${appointment.procedure}`}
                                                            >
                                                                <option value="">
                                                                    {updatingId === appointment.id
                                                                        ? "Updating..."
                                                                        : "Update Status"}
                                                                </option>

                                                                {transitions.map((nextStatus) => (
                                                                    <option
                                                                        key={nextStatus}
                                                                        value={nextStatus}
                                                                    >
                                                                        {formatStatus(nextStatus)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}

                                                    {!canReschedule &&
                                                        (!canUpdateStatus ||
                                                            transitions.length === 0) && (
                                                            <span className="text-xs text-muted">
                                                                —
                                                            </span>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted">
                        {pagination.total > 0
                            ? `Showing ${(page - 1) * pagination.limit + 1}–${Math.min(
                                page * pagination.limit,
                                pagination.total
                            )} of ${pagination.total} appointments`
                            : "No appointment records"}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((current) => current - 1)}
                            disabled={isLoading || page <= 1}
                            className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-40"
                        >
                            <ChevronLeft size={15} />
                            Previous
                        </button>

                        <span className="px-2 text-xs text-muted">
                            Page {page} of {pagination.totalPages || 1}
                        </span>

                        <button
                            type="button"
                            onClick={() => setPage((current) => current + 1)}
                            disabled={
                                isLoading ||
                                page >= pagination.totalPages
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Create / Edit form */}
            {showForm && (
                <AppointmentForm
                    appointment={selectedAppointment}
                    onCancel={closeForm}
                    onCreated={() => {
                        closeForm();
                        setPage(1);
                        refreshAppointments();
                    }}
                    onUpdated={() => {
                        closeForm();
                        refreshAppointments();
                    }}
                />
            )}
        </div>
    );
}

export default Appointments;
