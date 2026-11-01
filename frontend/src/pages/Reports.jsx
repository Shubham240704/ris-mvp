
import { useEffect, useState } from "react";
import {
    FileText,
    Plus,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Eye,
    Pencil,
    CheckCircle2,
    X,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReportForm from "../components/reports/ReportForm";

const reportStatuses = ["DRAFT", "REVIEWED", "FINALIZED"];

const statusStyles = {
    DRAFT: "bg-amber-50 text-amber-700",
    REVIEWED: "bg-blue-50 text-blue-700",
    FINALIZED: "bg-green-50 text-green-700",
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

function ReportDetails({
    report,
    user,
    onClose,
    onEdit,
    onReview,
    onFinalize,
    isActionLoading,
}) {
    if (!report) return null;

    const isRadiologist = user?.role === "RADIOLOGIST";
    const isAuthor = report.authorId === user?.id;

    const canEdit =
        isRadiologist &&
        isAuthor &&
        report.status === "DRAFT";

    const canReview =
        isRadiologist &&
        !isAuthor &&
        report.status === "DRAFT";

    const canFinalize =
        isRadiologist &&
        report.status === "REVIEWED";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="report-details-title"
                className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <div>
                        <h2
                            id="report-details-title"
                            className="text-lg font-semibold text-ink"
                        >
                            Radiology Report
                        </h2>

                        <p className="mt-1 text-xs text-muted">
                            {report.order?.accessionNo || "Accession unavailable"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close report details"
                        className="rounded-md p-2 text-muted hover:bg-slate-100"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    {/* Report status */}
                    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs text-muted">
                                Report Status
                            </p>

                            <span
                                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[report.status] ||
                                    "bg-slate-100 text-slate-700"
                                    }`}
                            >
                                {formatValue(report.status)}
                            </span>
                        </div>

                        {report.status === "FINALIZED" && (
                            <div className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
                                <CheckCircle2
                                    size={15}
                                    className="mr-1 inline"
                                />
                                Final report — read only
                            </div>
                        )}
                    </section>

                    {/* Examination information */}
                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-ink">
                            Examination Information
                        </h3>

                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted">
                                    Patient
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                    {report.order?.patient?.firstName}{" "}
                                    {report.order?.patient?.lastName}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">
                                    Patient Number
                                </p>
                                <p className="mt-1 text-sm text-ink">
                                    {report.order?.patient?.patientNumber || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">
                                    Procedure
                                </p>
                                <p className="mt-1 text-sm text-ink">
                                    {report.order?.procedure || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">
                                    Modality
                                </p>
                                <p className="mt-1 text-sm text-ink">
                                    {formatValue(report.order?.modality)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">
                                    Accession Number
                                </p>
                                <p className="mt-1 break-all text-sm font-medium text-ink">
                                    {report.order?.accessionNo || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted">
                                    Report Author
                                </p>
                                <p className="mt-1 text-sm text-ink">
                                    {report.author?.name || "—"}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Findings */}
                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-ink">
                            Findings
                        </h3>

                        <div className="min-h-28 whitespace-pre-wrap rounded-lg border border-line p-4 text-sm leading-7 text-ink">
                            {report.findings || "No findings entered."}
                        </div>
                    </section>

                    {/* Impression */}
                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-ink">
                            Impression
                        </h3>

                        <div className="min-h-24 whitespace-pre-wrap rounded-lg border border-line p-4 text-sm leading-7 text-ink">
                            {report.impression || "No impression entered."}
                        </div>
                    </section>

                    {/* Timestamps */}
                    <section className="grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted">
                                Created On
                            </p>
                            <p className="mt-1 text-sm text-ink">
                                {formatDateTime(report.createdAt)}
                            </p>
                        </div>

                        {report.finalizedAt && (
                            <div>
                                <p className="text-xs text-muted">
                                    Finalized On
                                </p>
                                <p className="mt-1 text-sm text-ink">
                                    {formatDateTime(report.finalizedAt)}
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Workflow actions */}
                    {(canEdit || canReview || canFinalize) && (
                        <section className="rounded-lg border border-line bg-slate-50 p-4">
                            <h3 className="mb-3 text-sm font-semibold text-ink">
                                Report Workflow
                            </h3>

                            <div className="flex flex-wrap gap-3">
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={onEdit}
                                        disabled={isActionLoading}
                                        className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-100"
                                    >
                                        <Pencil size={15} />
                                        Edit Draft
                                    </button>
                                )}

                                {canReview && (
                                    <button
                                        type="button"
                                        onClick={onReview}
                                        disabled={isActionLoading}
                                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
                                    >
                                        <CheckCircle2 size={15} />
                                        Review Report
                                    </button>
                                )}

                                {canFinalize && (
                                    <button
                                        type="button"
                                        onClick={onFinalize}
                                        disabled={isActionLoading}
                                        className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
                                    >
                                        <CheckCircle2 size={15} />
                                        Finalize Report
                                    </button>
                                )}

                                {isActionLoading && (
                                    <span className="self-center text-xs text-muted">
                                        Updating report...
                                    </span>
                                )}
                            </div>

                            {canReview && (
                                <p className="mt-3 text-xs leading-5 text-muted">
                                    You are reviewing another radiologist's draft.
                                    The report author cannot review their own report.
                                </p>
                            )}
                        </section>
                    )}
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

function Reports() {
    const { user } = useAuth();

    const isRadiologist = user?.role === "RADIOLOGIST";

    const [reports, setReports] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [appliedStatus, setAppliedStatus] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [activeAction, setActiveAction] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadReports() {
            setIsLoading(true);
            setError("");

            try {
                const response = await api.get("/radiology-reports", {
                    params: {
                        page,
                        limit: 20,
                        ...(appliedStatus
                            ? { status: appliedStatus }
                            : {}),
                    },
                });

                if (active) {
                    setReports(response.data.data || []);
                    setPagination(response.data.pagination);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load radiology reports."
                    );
                }
            } finally {
                if (active) setIsLoading(false);
            }
        }

        loadReports();

        return () => {
            active = false;
        };
    }, [page, appliedStatus, reloadKey]);

    useEffect(() => {
        let active = true;

        async function loadReportDetails() {
            if (!selectedReportId) {
                setSelectedReport(null);
                return;
            }

            setIsLoadingDetails(true);
            setActionError("");

            try {
                const response = await api.get(
                    `/radiology-reports/${selectedReportId}`
                );

                if (active) {
                    setSelectedReport(response.data.data);
                }
            } catch (err) {
                if (active) {
                    setActionError(
                        err.response?.data?.message ||
                        "Unable to load report details."
                    );
                    setSelectedReportId(null);
                }
            } finally {
                if (active) setIsLoadingDetails(false);
            }
        }

        loadReportDetails();

        return () => {
            active = false;
        };
    }, [selectedReportId, reloadKey]);

    function refreshReports() {
        setReloadKey((key) => key + 1);
    }

    function closeReportDetails() {
        setSelectedReportId(null);
        setSelectedReport(null);
    }

    function applyFilter(event) {
        event.preventDefault();
        setPage(1);
        setAppliedStatus(status);
    }

    function clearFilter() {
        setStatus("");
        setAppliedStatus("");
        setPage(1);
    }

    async function performReportAction(action, message) {
        if (!selectedReportId) return;

        const confirmed = window.confirm(message);

        if (!confirmed) return;

        setActiveAction(action);
        setActionError("");

        try {
            await api.patch(
                `/radiology-reports/${selectedReportId}/${action}`
            );

            refreshReports();
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                "Unable to update the report."
            );
        } finally {
            setActiveAction("");
        }
    }

    function openEditForm() {
        setShowForm(true);
    }

    const draftCount = reports.filter(
        (report) => report.status === "DRAFT"
    ).length;

    const reviewedCount = reports.filter(
        (report) => report.status === "REVIEWED"
    ).length;

    const finalizedCount = reports.filter(
        (report) => report.status === "FINALIZED"
    ).length;

    return (
        <div className="space-y-6">
            {/* Heading */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-ink">
                        Radiology Reports
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Create, review and manage examination reports.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={refreshReports}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={15}
                            className={isLoading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    {isRadiologist && (
                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            <Plus size={17} />
                            Create Report
                        </button>
                    )}
                </div>
            </section>

            {/* Summary cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Draft Reports
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                        {draftCount}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        On the current page
                    </p>
                </div>

                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Reviewed Reports
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                        {reviewedCount}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        On the current page
                    </p>
                </div>

                <div className="rounded-lg border border-line bg-surface p-5">
                    <p className="text-sm font-medium text-muted">
                        Finalized Reports
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                        {finalizedCount}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        On the current page
                    </p>
                </div>
            </section>

            {/* Status filter */}
            <section className="rounded-lg border border-line bg-surface p-5">
                <form
                    onSubmit={applyFilter}
                    className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                    <div className="flex-1">
                        <label
                            htmlFor="reportStatus"
                            className="mb-1.5 block text-sm font-medium text-ink"
                        >
                            Report Status
                        </label>

                        <select
                            id="reportStatus"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary sm:max-w-xs"
                        >
                            <option value="">All Reports</option>

                            {reportStatuses.map((item) => (
                                <option key={item} value={item}>
                                    {formatValue(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            Apply Filter
                        </button>

                        <button
                            type="button"
                            onClick={clearFilter}
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

            {/* Reports table */}
            <section className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h3 className="text-base font-semibold text-ink">
                        Report Records
                    </h3>

                    <span className="text-xs text-muted">
                        {pagination.total ?? 0} total reports
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-line">
                                {[
                                    "Accession Number",
                                    "Patient",
                                    "Procedure",
                                    "Modality",
                                    "Report Author",
                                    "Created",
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
                                        colSpan="8"
                                        className="px-5 py-12 text-center text-sm text-muted"
                                    >
                                        Loading radiology reports...
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-14">
                                        <div className="text-center">
                                            <FileText
                                                size={28}
                                                className="mx-auto mb-3 text-slate-400"
                                            />

                                            <p className="text-sm font-medium text-ink">
                                                No reports found
                                            </p>

                                            <p className="mt-1 text-xs text-muted">
                                                Reports will appear here when created for completed examinations.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedReportId(report.id)}
                                                className="text-sm font-semibold text-primary hover:underline"
                                            >
                                                {report.order?.accessionNo || "—"}
                                            </button>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-ink">
                                                {report.order?.patient?.firstName}{" "}
                                                {report.order?.patient?.lastName}
                                            </p>
                                            <p className="mt-1 text-xs text-muted">
                                                {report.order?.patient?.patientNumber}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-ink">
                                            {report.order?.procedure || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {formatValue(report.order?.modality)}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-muted">
                                            {report.author?.name || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {formatDateTime(report.createdAt)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[report.status] ||
                                                    "bg-slate-100 text-slate-700"
                                                    }`}
                                            >
                                                {formatValue(report.status)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                title="View report"
                                                onClick={() => setSelectedReportId(report.id)}
                                                className="rounded-md border border-line p-2 text-muted hover:bg-slate-100 hover:text-ink"
                                            >
                                                <Eye size={15} />
                                            </button>
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
                            )} of ${pagination.total} reports`
                            : "No report records"}
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
                            disabled={isLoading || page >= pagination.totalPages}
                            className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Create or edit report */}
            {showForm && (
                <ReportForm
                    report={selectedReport}
                    onCancel={() => setShowForm(false)}
                    onCreated={() => {
                        setShowForm(false);
                        setPage(1);
                        refreshReports();
                    }}
                    onUpdated={() => {
                        setShowForm(false);
                        refreshReports();
                    }}
                />
            )}

            {/* Report details */}
            {selectedReportId && (
                isLoadingDetails ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="rounded-lg bg-white p-6 text-sm text-muted">
                            Loading report details...
                        </div>
                    </div>
                ) : selectedReport ? (
                    <ReportDetails
                        report={selectedReport}
                        user={user}
                        onClose={closeReportDetails}
                        onEdit={openEditForm}
                        onReview={() =>
                            performReportAction(
                                "review",
                                "Submit this report for independent review?"
                            )
                        }
                        onFinalize={() =>
                            performReportAction(
                                "finalize",
                                "Finalize this reviewed report? Finalized reports cannot be edited."
                            )
                        }
                        isActionLoading={Boolean(activeAction)}
                    />
                ) : null
            )}
        </div>
    );
}

export default Reports;
