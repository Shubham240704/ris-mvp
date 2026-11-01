
import { useEffect, useState } from "react";
import {
    ClipboardList,
    Plus,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Eye,
    ShieldAlert,
    X,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import OrderForm from "../components/worklist/OrderForm";

const modalities = [
    "XRAY",
    "CT",
    "MRI",
    "ULTRASOUND",
    "MAMMOGRAPHY",
    "PET_CT",
    "OTHER",
];

const priorities = ["ROUTINE", "URGENT", "STAT"];

const statuses = [
    "ORDERED",
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
];

const normalTransitions = {
    ORDERED: ["SCHEDULED", "IN_PROGRESS", "CANCELLED"],
    SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
};

const overrideTransitions = {
    ORDERED: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    SCHEDULED: ["ORDERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    IN_PROGRESS: ["SCHEDULED", "COMPLETED", "CANCELLED"],
    COMPLETED: ["IN_PROGRESS"],
    CANCELLED: ["ORDERED", "SCHEDULED", "IN_PROGRESS"],
};

const statusStyles = {
    ORDERED: "bg-slate-100 text-slate-700",
    SCHEDULED: "bg-blue-50 text-blue-700",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
};

const priorityStyles = {
    ROUTINE: "bg-slate-100 text-slate-700",
    URGENT: "bg-amber-50 text-amber-700",
    STAT: "bg-red-50 text-red-700",
};

function formatValue(value) {
    return value?.replace(/_/g, " ") || "—";
}

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

function OrderDetails({ order, onClose }) {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="order-details-title"
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <div>
                        <h2
                            id="order-details-title"
                            className="text-lg font-semibold text-ink"
                        >
                            Radiology Order Details
                        </h2>

                        <p className="mt-1 text-xs text-muted">
                            {order.accessionNo}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close order details"
                        className="rounded-md p-2 text-muted hover:bg-slate-100"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    <section>
                        <h3 className="mb-4 text-sm font-semibold text-ink">
                            Patient Information
                        </h3>

                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted">Patient Name</p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                    {order.patient?.firstName}{" "}
                                    {order.patient?.lastName}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">Patient Number</p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                    {order.patient?.patientNumber}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">Modality</p>
                                <p className="mt-1 text-sm text-ink">
                                    {formatValue(order.modality)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">Procedure</p>
                                <p className="mt-1 text-sm text-ink">
                                    {order.procedure}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="mb-4 text-sm font-semibold text-ink">
                            Order Information
                        </h3>

                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted">Accession Number</p>
                                <p className="mt-1 break-all text-sm font-medium text-ink">
                                    {order.accessionNo}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">Order Date</p>
                                <p className="mt-1 text-sm text-ink">
                                    {formatDateTime(order.orderedAt)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">Priority</p>
                                <p className="mt-1 text-sm text-ink">
                                    {formatValue(order.priority)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">Status</p>
                                <p className="mt-1 text-sm text-ink">
                                    {formatValue(order.status)}
                                </p>
                            </div>
                        </div>
                    </section>

                    {order.clinicalNote && (
                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-ink">
                                Clinical Notes
                            </h3>

                            <div className="rounded-lg border border-line bg-slate-50 p-4">
                                <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
                                    {order.clinicalNote}
                                </p>
                            </div>
                        </section>
                    )}

                    {order.appointment && (
                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-ink">
                                Linked Appointment
                            </h3>

                            <div className="rounded-lg border border-line p-4">
                                <p className="text-sm font-medium text-ink">
                                    {order.appointment.procedure}
                                </p>

                                <p className="mt-1 text-xs text-muted">
                                    {formatDateTime(order.appointment.scheduledAt)}
                                    {" · "}
                                    {formatValue(order.appointment.status)}
                                </p>
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-ink">
                            Reporting and Imaging Status
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-line p-4">
                                <p className="text-xs text-muted">
                                    Radiology Report
                                </p>

                                <p className="mt-2 text-sm font-medium text-ink">
                                    {order.report
                                        ? formatValue(order.report.status)
                                        : "No report created"}
                                </p>
                            </div>

                            <div className="rounded-lg border border-line p-4">
                                <p className="text-xs text-muted">
                                    PACS / Study Link
                                </p>

                                <p className="mt-2 text-sm font-medium text-ink">
                                    {order.studyLink?.verified
                                        ? "Study link verified"
                                        : order.studyLink
                                            ? "Study link not verified"
                                            : "No study linked"}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex justify-end border-t border-line bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-line bg-white px-5 py-2 text-sm font-medium text-ink hover:bg-slate-100"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function OrderOverrideForm({ order, onCancel, onSubmit, isSubmitting }) {
    const availableStatuses =
        overrideTransitions[order.status] || [];

    const [status, setStatus] = useState(
        availableStatuses[0] || ""
    );

    const [reason, setReason] = useState("");

    function handleSubmit(event) {
        event.preventDefault();

        if (reason.trim().length < 10) return;

        onSubmit({
            status,
            reason: reason.trim(),
        });
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="override-title"
                className="w-full max-w-lg rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={20} className="text-amber-600" />
                        <h2 id="override-title" className="text-base font-semibold text-ink">
                            Override Order Status
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="rounded-md p-2 text-muted hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                        Administrative overrides are recorded in the audit log.
                        Use this only to correct an exceptional status issue.
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink">
                            Accession Number
                        </label>
                        <p className="break-all text-sm text-muted">
                            {order.accessionNo}
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="overrideStatus"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            New Status *
                        </label>

                        <select
                            id="overrideStatus"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            required
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                        >
                            {availableStatuses.map((item) => (
                                <option key={item} value={item}>
                                    {formatValue(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="overrideReason"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Reason for Override *
                        </label>

                        <textarea
                            id="overrideReason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            minLength={10}
                            maxLength={1000}
                            rows={4}
                            required
                            placeholder="Explain why this status correction is required..."
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                        />

                        <p className="mt-1 text-xs text-muted">
                            Minimum 10 characters. This reason will be audited.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-line pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting || !status || reason.trim().length < 10}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Confirm Override"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Worklist() {
    const { user } = useAuth();

    const canCreateOrder =
        user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

    const canUpdateStatus =
        user?.role === "ADMIN" || user?.role === "TECHNICIAN";

    const isAdmin = user?.role === "ADMIN";

    const [orders, setOrders] = useState([]);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const [page, setPage] = useState(1);
    const [modality, setModality] = useState("");
    const [priority, setPriority] = useState("");
    const [status, setStatus] = useState("");

    const [appliedFilters, setAppliedFilters] = useState({
        modality: "",
        priority: "",
        status: "",
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [updatingId, setUpdatingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const [overrideOrder, setOverrideOrder] = useState(null);
    const [isOverriding, setIsOverriding] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadOrders() {
            setIsLoading(true);
            setError("");

            try {
                const params = {
                    page,
                    limit: 20,
                    ...(appliedFilters.modality
                        ? { modality: appliedFilters.modality }
                        : {}),
                    ...(appliedFilters.priority
                        ? { priority: appliedFilters.priority }
                        : {}),
                    ...(appliedFilters.status
                        ? { status: appliedFilters.status }
                        : {}),
                };

                const response = await api.get("/radiology-orders", {
                    params,
                });

                if (active) {
                    setOrders(response.data.data || []);
                    setPagination(response.data.pagination);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load radiology orders."
                    );
                }
            } finally {
                if (active) setIsLoading(false);
            }
        }

        loadOrders();

        return () => {
            active = false;
        };
    }, [page, appliedFilters, reloadKey]);

    useEffect(() => {
        let active = true;

        async function loadOrderDetails() {
            if (!selectedOrderId) {
                setOrderDetails(null);
                return;
            }

            setIsLoadingDetails(true);

            try {
                const response = await api.get(
                    `/radiology-orders/${selectedOrderId}`
                );

                if (active) {
                    setOrderDetails(response.data.data);
                }
            } catch (err) {
                if (active) {
                    setActionError(
                        err.response?.data?.message ||
                        "Unable to load order details."
                    );
                    setSelectedOrderId(null);
                }
            } finally {
                if (active) setIsLoadingDetails(false);
            }
        }

        loadOrderDetails();

        return () => {
            active = false;
        };
    }, [selectedOrderId, reloadKey]);

    function refreshOrders() {
        setReloadKey((key) => key + 1);
    }

    function applyFilters(event) {
        event.preventDefault();
        setPage(1);
        setAppliedFilters({
            modality,
            priority,
            status,
        });
    }

    function clearFilters() {
        setModality("");
        setPriority("");
        setStatus("");
        setPage(1);

        setAppliedFilters({
            modality: "",
            priority: "",
            status: "",
        });
    }

    async function updateStatus(orderId, newStatus) {
        setActionError("");
        setUpdatingId(orderId);

        try {
            await api.patch(
                `/radiology-orders/${orderId}/status`,
                { status: newStatus }
            );

            refreshOrders();
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                "Unable to update order status."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    async function submitOverride({ status: newStatus, reason }) {
        if (!overrideOrder) return;

        setIsOverriding(true);
        setActionError("");

        try {
            await api.patch(
                `/radiology-orders/${overrideOrder.id}/status/override`,
                {
                    status: newStatus,
                    reason,
                }
            );

            setOverrideOrder(null);
            refreshOrders();
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                "Unable to override order status."
            );
        } finally {
            setIsOverriding(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Heading */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-ink">
                        Radiology Worklist
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Manage examination orders and workflow statuses.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={refreshOrders}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={15}
                            className={isLoading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    {canCreateOrder && (
                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            <Plus size={17} />
                            Create Order
                        </button>
                    )}
                </div>
            </section>

            {/* Summary */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Total Orders
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                        {pagination.total ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        Matching records
                    </p>
                </div>

                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        In Progress
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                        {orders.filter((item) => item.status === "IN_PROGRESS").length}
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
                        {orders.filter((item) => item.status === "COMPLETED").length}
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
                    className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <div>
                        <label
                            htmlFor="worklistModality"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Modality
                        </label>

                        <select
                            id="worklistModality"
                            value={modality}
                            onChange={(event) => setModality(event.target.value)}
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        >
                            <option value="">All Modalities</option>
                            {modalities.map((item) => (
                                <option key={item} value={item}>
                                    {formatValue(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="worklistPriority"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Priority
                        </label>

                        <select
                            id="worklistPriority"
                            value={priority}
                            onChange={(event) => setPriority(event.target.value)}
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        >
                            <option value="">All Priorities</option>
                            {priorities.map((item) => (
                                <option key={item} value={item}>
                                    {formatValue(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="worklistStatus"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Order Status
                        </label>

                        <select
                            id="worklistStatus"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        >
                            <option value="">All Statuses</option>
                            {statuses.map((item) => (
                                <option key={item} value={item}>
                                    {formatValue(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            Apply Filters
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

            {(error || actionError) && (
                <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error || actionError}
                </div>
            )}

            {/* Worklist table */}
            <section className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h3 className="text-base font-semibold text-ink">
                        Examination Orders
                    </h3>

                    <span className="text-xs text-muted">
                        {pagination.total ?? 0} total orders
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-line">
                                {[
                                    "Accession Number",
                                    "Patient",
                                    "Procedure",
                                    "Modality",
                                    "Priority",
                                    "Ordered At",
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
                                        colSpan="8"
                                        className="px-5 py-12 text-center text-sm text-muted"
                                    >
                                        Loading examination orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-14">
                                        <div className="text-center">
                                            <ClipboardList
                                                size={28}
                                                className="mx-auto mb-3 text-slate-400"
                                            />

                                            <p className="text-sm font-medium text-ink">
                                                No examination orders found
                                            </p>

                                            <p className="mt-1 text-xs text-muted">
                                                Create an order or change the filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const transitions =
                                        normalTransitions[order.status] || [];

                                    return (
                                        <tr
                                            key={order.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrderId(order.id)}
                                                    className="text-sm font-semibold text-primary hover:underline"
                                                >
                                                    {order.accessionNo}
                                                </button>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-ink">
                                                    {order.patient?.firstName}{" "}
                                                    {order.patient?.lastName}
                                                </p>

                                                <p className="mt-1 text-xs text-muted">
                                                    {order.patient?.patientNumber}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-ink">
                                                {order.procedure}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                                {formatValue(order.modality)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[order.priority] ||
                                                        "bg-slate-100 text-slate-700"
                                                        }`}
                                                >
                                                    {formatValue(order.priority)}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                                {formatDateTime(order.orderedAt)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.status] ||
                                                        "bg-slate-100 text-slate-700"
                                                        }`}
                                                >
                                                    {formatValue(order.status)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        title="View order details"
                                                        onClick={() => setSelectedOrderId(order.id)}
                                                        className="rounded-md border border-line p-2 text-muted hover:bg-slate-100 hover:text-ink"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {canUpdateStatus &&
                                                        transitions.length > 0 && (
                                                            <select
                                                                value=""
                                                                disabled={updatingId === order.id}
                                                                onChange={(event) =>
                                                                    updateStatus(
                                                                        order.id,
                                                                        event.target.value
                                                                    )
                                                                }
                                                                aria-label={`Update status for ${order.accessionNo}`}
                                                                className="max-w-[145px] rounded-md border border-line bg-white px-2 py-2 text-xs outline-none focus:border-primary disabled:opacity-50"
                                                            >
                                                                <option value="">
                                                                    {updatingId === order.id
                                                                        ? "Updating..."
                                                                        : "Update Status"}
                                                                </option>

                                                                {transitions.map((nextStatus) => (
                                                                    <option
                                                                        key={nextStatus}
                                                                        value={nextStatus}
                                                                    >
                                                                        {formatValue(nextStatus)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}

                                                    {isAdmin &&
                                                        (overrideTransitions[order.status] || []).length > 0 && (
                                                            <button
                                                                type="button"
                                                                title="Administrator status override"
                                                                onClick={() => setOverrideOrder(order)}
                                                                className="rounded-md border border-amber-200 p-2 text-amber-700 hover:bg-amber-50"
                                                            >
                                                                <ShieldAlert size={15} />
                                                            </button>
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
                            )} of ${pagination.total} orders`
                            : "No order records"}
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

            {/* Create order */}
            {showForm && (
                <OrderForm
                    onCancel={() => setShowForm(false)}
                    onCreated={() => {
                        setShowForm(false);
                        setPage(1);
                        refreshOrders();
                    }}
                />
            )}

            {/* Order details */}
            {selectedOrderId && (
                isLoadingDetails ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="rounded-lg bg-white p-6 text-sm text-muted">
                            Loading order details...
                        </div>
                    </div>
                ) : orderDetails ? (
                    <OrderDetails
                        order={orderDetails}
                        onClose={() => {
                            setSelectedOrderId(null);
                            setOrderDetails(null);
                        }}
                    />
                ) : null
            )}

            {/* Admin override */}
            {overrideOrder && (
                <OrderOverrideForm
                    order={overrideOrder}
                    onCancel={() => setOverrideOrder(null)}
                    onSubmit={submitOverride}
                    isSubmitting={isOverriding}
                />
            )}
        </div>
    );
}

export default Worklist;
