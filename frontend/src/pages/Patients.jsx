
import { useEffect, useState } from "react";
import {
    Search,
    Users,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import PatientForm from "../components/patients/PatientForm";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import PatientDetails from "../components/patients/PatientDetails";

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

function Patients() {
    const [patients, setPatients] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const { user } = useAuth();
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [showPatientForm, setShowPatientForm] = useState(false);

    const canRegisterPatients =
        user?.role === "ADMIN" || user?.role === "RECEPTIONIST";
    useEffect(() => {
        let isMounted = true;

        async function loadPatients() {
            setIsLoading(true);
            setError("");

            try {
                const response = await api.get("/patients", {
                    params: {
                        page,
                        limit: 20,
                        ...(search ? { search } : {}),
                    },
                });

                if (isMounted) {
                    setPatients(response.data.data || []);
                    setPagination(response.data.pagination);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load patient records."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadPatients();

        return () => {
            isMounted = false;
        };
    }, [page, search, reloadKey]);

    function handleSearch(event) {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    }

    function handleClearSearch() {
        setSearchInput("");
        setSearch("");
        setPage(1);
    }

    return (
        <div className="space-y-6">
            {/* Page heading */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-ink">
                        Patient Management
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                        Register, search and manage patient records.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setReloadKey((key) => key + 1)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={15}
                            className={isLoading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    {canRegisterPatients && (
                        <button
                            type="button"
                            onClick={() => setShowPatientForm(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                        >
                            <span className="text-lg leading-none">+</span>
                            Register Patient
                        </button>
                    )}
                </div>
            </section>

            {/* Patient count */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-surface p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted">
                            Total Patients
                        </p>

                        <Users size={19} className="text-slate-400" />
                    </div>

                    <p className="mt-4 text-3xl font-semibold text-ink">
                        {pagination.total ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                        Registered patient records
                    </p>
                </div>
            </section>

            {/* Search */}
            <section className="rounded-lg border border-line bg-surface p-5">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-3 sm:flex-row"
                >
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="Search by patient name or patient number..."
                            className="w-full rounded-md border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                    </div>

                    <button
                        type="submit"
                        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        Search
                    </button>

                    {search && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </section>

            {/* Patient table */}
            <section className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="flex flex-col gap-1 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-ink">
                        Patient Records
                    </h3>

                    <p className="text-xs text-muted">
                        {pagination.total ?? 0} total records
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="m-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-line">
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                                    Patient Number
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                                    Patient Name
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                                    Date of Birth
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                                    Sex
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                                    Phone
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                                    Registered
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-line">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-5 py-12 text-center text-sm text-muted"
                                    >
                                        Loading patient records...
                                    </td>
                                </tr>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-14">
                                        <div className="text-center">
                                            <Users
                                                size={28}
                                                className="mx-auto mb-3 text-slate-400"
                                            />

                                            <p className="text-sm font-medium text-ink">
                                                No patient records found
                                            </p>

                                            <p className="mt-1 text-xs text-muted">
                                                Try a different search term.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPatientId(patient.id)}
                                                className="text-primary hover:underline"
                                            >
                                                {patient.patientNumber}
                                            </button>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-ink">
                                            {patient.firstName}{" "}
                                            {patient.lastName}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {formatDate(patient.dateOfBirth)}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {patient.sex || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {patient.phone || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                                            {formatDate(patient.createdAt)}
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
                            )} of ${pagination.total} patients`
                            : "No patient records"}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((current) => current - 1)}
                            disabled={
                                isLoading ||
                                page <= 1 ||
                                !pagination.totalPages
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </section>
            {showPatientForm && (
                <PatientForm
                    onCancel={() => setShowPatientForm(false)}
                    onCreated={() => {
                        setShowPatientForm(false);
                        setPage(1);
                        setSearch("");
                        setSearchInput("");
                        setReloadKey((key) => key + 1);
                    }}
                />
            )}
            {selectedPatientId && (
                <PatientDetails
                    patientId={selectedPatientId}
                    onClose={() => setSelectedPatientId(null)}
                    onUpdated={() => {
                        setReloadKey((key) => key + 1);
                    }}
                />
            )}
        </div>
    );
}

export default Patients;
