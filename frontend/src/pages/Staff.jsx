
import { useEffect, useState } from "react";
import {
    UserPlus,
    Users,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Copy,
    X,
    Ban,
    Mail,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const staffRoles = [
    "RECEPTIONIST",
    "RADIOLOGIST",
    "TECHNICIAN",
    "PHARMACIST",
];

const invitationStatuses = [
    "PENDING",
    "ACCEPTED",
    "REVOKED",
    "EXPIRED",
];

const statusStyles = {
    PENDING: "bg-amber-50 text-amber-700",
    ACCEPTED: "bg-green-50 text-green-700",
    REVOKED: "bg-red-50 text-red-700",
    EXPIRED: "bg-slate-100 text-slate-700",
};

function formatValue(value) {
    return value?.replace(/_/g, " ") || "—";
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

function InvitationForm({ onCancel, onCreated }) {
    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "RECEPTIONIST",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const response = await api.post("/staff/invitations", {
                name: form.name.trim(),
                email: form.email.trim(),
                role: form.role,
            });

            onCreated(response.data.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create staff invitation."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputClass =
        "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="invitation-title"
                className="w-full max-w-lg rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                            <UserPlus size={20} />
                        </div>

                        <div>
                            <h2
                                id="invitation-title"
                                className="text-lg font-semibold text-ink"
                            >
                                Invite Staff Member
                            </h2>

                            <p className="mt-0.5 text-xs text-muted">
                                Create an invitation for a new staff account.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        aria-label="Close invitation form"
                        className="rounded-md p-2 text-muted hover:bg-slate-100"
                    >
                        <X size={19} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 p-6">
                        {error && (
                            <div
                                role="alert"
                                className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="staffName"
                                className="mb-1.5 block text-sm font-medium text-ink"
                            >
                                Full Name *
                            </label>

                            <input
                                id="staffName"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                minLength={2}
                                maxLength={120}
                                required
                                placeholder="Enter staff member's name"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="staffEmail"
                                className="mb-1.5 block text-sm font-medium text-ink"
                            >
                                Email Address *
                            </label>

                            <input
                                id="staffEmail"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                maxLength={254}
                                required
                                placeholder="Enter official email address"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="staffRole"
                                className="mb-1.5 block text-sm font-medium text-ink"
                            >
                                Assign Role *
                            </label>

                            <select
                                id="staffRole"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                {staffRoles.map((role) => (
                                    <option key={role} value={role}>
                                        {formatValue(role)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-md bg-slate-50 p-3">
                            <p className="text-xs leading-5 text-muted">
                                The invitation expires after 24 hours.
                                The staff member must create a password
                                using the invitation link to activate
                                their account.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-line bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="rounded-md border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-slate-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
                        >
                            {isSubmitting ? "Creating..." : "Create Invitation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function InvitationResult({ invitation, invitationUrl, onClose }) {
    const [copyMessage, setCopyMessage] = useState("");

    async function copyInvitationLink() {
        try {
            await navigator.clipboard.writeText(invitationUrl);
            setCopyMessage("Invitation link copied successfully.");
        } catch {
            setCopyMessage(
                "Copy unavailable. Select and copy the complete link manually."
            );
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="invitation-result-title"
                className="w-full max-w-lg rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <h2
                        id="invitation-result-title"
                        className="text-lg font-semibold text-ink"
                    >
                        Invitation Created
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close invitation result"
                        className="rounded-md p-2 text-muted hover:bg-slate-100"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <div className="rounded-md bg-green-50 p-3">
                        <p className="text-sm font-medium text-green-800">
                            Invitation created successfully.
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                            {invitation.name} · {invitation.email}
                        </p>
                    </div>

                    <div>
                        <p className="mb-2 text-sm font-medium text-ink">
                            Invitation Link
                        </p>

                        <input
                            type="text"
                            readOnly
                            value={invitationUrl}
                            onFocus={(event) => event.target.select()}
                            className="w-full rounded-md border border-line bg-slate-50 px-3 py-2.5 text-xs text-ink"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={copyInvitationLink}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        <Copy size={16} />
                        Copy Invitation Link
                    </button>

                    {copyMessage && (
                        <p role="status" className="text-xs text-muted">
                            {copyMessage}
                        </p>
                    )}

                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs leading-5 text-amber-800">
                            Security notice: this is the one-time invitation
                            link. It will not be displayed again. Share it
                            only with the intended staff member. It expires
                            after 24 hours.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end border-t border-line bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-line bg-white px-5 py-2 text-sm font-medium text-ink hover:bg-slate-100"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

function Staff() {
    const { user } = useAuth();

    const isAdmin = user?.role === "ADMIN";

    const [invitations, setInvitations] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [email, setEmail] = useState("");

    const [appliedFilters, setAppliedFilters] = useState({
        status: "",
        email: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [revokingId, setRevokingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [invitationResult, setInvitationResult] = useState(null);

    useEffect(() => {
        if (!isAdmin) return;

        let active = true;

        async function loadInvitations() {
            setIsLoading(true);
            setError("");

            try {
                const response = await api.get("/staff/invitations", {
                    params: {
                        page,
                        limit: 20,
                        ...(appliedFilters.status
                            ? { status: appliedFilters.status }
                            : {}),
                        ...(appliedFilters.email
                            ? { email: appliedFilters.email }
                            : {}),
                    },
                });

                if (active) {
                    setInvitations(response.data.data || []);
                    setPagination(response.data.pagination);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load staff invitations."
                    );
                }
            } finally {
                if (active) setIsLoading(false);
            }
        }

        loadInvitations();

        return () => {
            active = false;
        };
    }, [isAdmin, page, appliedFilters, reloadKey]);

    function refreshInvitations() {
        setReloadKey((key) => key + 1);
    }

    function applyFilters(event) {
        event.preventDefault();

        setPage(1);
        setAppliedFilters({
            status,
            email: email.trim().toLowerCase(),
        });
    }

    function clearFilters() {
        setStatus("");
        setEmail("");
        setPage(1);
        setAppliedFilters({
            status: "",
            email: "",
        });
    }

    async function revokeInvitation(invitation) {
        const confirmed = window.confirm(
            `Revoke the pending invitation for ${invitation.email}?`
        );

        if (!confirmed) return;

        setRevokingId(invitation.id);
        setActionError("");

        try {
            await api.patch(
                `/staff/invitations/${invitation.id}/revoke`
            );

            refreshInvitations();
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                "Unable to revoke this invitation."
            );
        } finally {
            setRevokingId(null);
        }
    }

    if (!isAdmin) {
        return (
            <div className="rounded-lg border border-line bg-surface p-8">
                <h2 className="text-lg font-semibold text-ink">
                    Access Restricted
                </h2>

                <p className="mt-2 text-sm text-muted">
                    Staff management is available to administrators only.
                </p>
            </div>
        );
    }

    const pendingCount = invitations.filter(
        (item) => item.status === "PENDING"
    ).length;

    const acceptedCount = invitations.filter(
        (item) => item.status === "ACCEPTED"
    ).length;

    return (
        <div className="space-y-6">
            {/* Heading */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-ink">
                        Staff Management
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Invite and manage staff onboarding.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={refreshInvitations}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={15}
                            className={isLoading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        <UserPlus size={17} />
                        Invite Staff
                    </button>
                </div>
            </section>

            {/* Summary cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-surface p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted">
                            Total Invitations
                        </p>
                        <Users size={19} className="text-slate-400" />
                    </div>

                    <p className="mt-4 text-3xl font-semibold text-ink">
                        {pagination.total ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                        Matching invitation records
                    </p>
                </div>

                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Pending Invitations
                    </p>

                    <p className="mt-4 text-3xl font-semibold text-ink">
                        {pendingCount}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                        On the current page
                    </p>
                </div>

                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Accepted Invitations
                    </p>

                    <p className="mt-4 text-3xl font-semibold text-ink">
                        {acceptedCount}
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
                    className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                    <div>
                        <label
                            htmlFor="invitationEmail"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Email Address
                        </label>

                        <input
                            id="invitationEmail"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Filter by email"
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="invitationStatus"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Invitation Status
                        </label>

                        <select
                            id="invitationStatus"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
                        >
                            <option value="">All Statuses</option>

                            {invitationStatuses.map((item) => (
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
                            className="rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-slate-50"
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

            {/* Invitation table */}
            <section className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h3 className="text-base font-semibold text-ink">
                        Staff Invitations
                    </h3>

                    <span className="text-xs text-muted">
                        {pagination.total ?? 0} total records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-line">
                                {[
                                    "Staff Member",
                                    "Email",
                                    "Assigned Role",
                                    "Invited On",
                                    "Expires On",
                                    "Status",
                                    "Action",
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
                                        Loading staff invitations...
                                    </td>
                                </tr>
                            ) : invitations.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-14">
                                        <div className="text-center">
                                            <Mail
                                                size={28}
                                                className="mx-auto mb-3 text-slate-400"
                                            />

                                            <p className="text-sm font-medium text-ink">
                                                No invitations found
                                            </p>

                                            <p className="mt-1 text-xs text-muted">
                                                Create an invitation to onboard a new staff member.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                invitations.map((invitation) => (
                                    <tr
                                        key={invitation.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-ink">
                                            {invitation.name}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {invitation.email}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-ink">
                                            {formatValue(invitation.role)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {formatDate(invitation.createdAt)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {formatDate(invitation.expiresAt)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[invitation.status] ||
                                                    "bg-slate-100 text-slate-700"
                                                    }`}
                                            >
                                                {formatValue(invitation.status)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            {invitation.status === "PENDING" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => revokeInvitation(invitation)}
                                                    disabled={revokingId === invitation.id}
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    <Ban size={14} />
                                                    {revokingId === invitation.id
                                                        ? "Revoking..."
                                                        : "Revoke"}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-muted">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
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
                            )} of ${pagination.total} invitations`
                            : "No invitation records"}
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

            {/* Create invitation */}
            {showForm && (
                <InvitationForm
                    onCancel={() => setShowForm(false)}
                    onCreated={(result) => {
                        setShowForm(false);
                        setInvitationResult(result);
                        setPage(1);
                        refreshInvitations();
                    }}
                />
            )}

            {/* One-time invitation URL */}
            {invitationResult && (
                <InvitationResult
                    invitation={invitationResult.invitation}
                    invitationUrl={invitationResult.invitationUrl}
                    onClose={() => setInvitationResult(null)}
                />
            )}
        </div>
    );
}

export default Staff;
