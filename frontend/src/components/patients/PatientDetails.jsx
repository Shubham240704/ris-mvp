
import { useEffect, useState } from "react";
import {
    X,
    UserRound,
    CalendarDays,
    ClipboardList,
    Pencil,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PatientForm from "./PatientForm";

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
    }).format(date);
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

function InfoField({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-1 break-words text-sm text-ink">
                {value || "—"}
            </p>
        </div>
    );
}

function PatientDetails({ patientId, onClose, onUpdated }) {
    const { user } = useAuth();

    const canEdit =
        user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

    const [patient, setPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [showEditForm, setShowEditForm] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isMounted = true;

        async function loadPatient() {
            setIsLoading(true);
            setError("");

            try {
                const response = await api.get(`/patients/${patientId}`);

                if (isMounted) {
                    setPatient(response.data.data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load patient details."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadPatient();

        return () => {
            isMounted = false;
        };
    }, [patientId, reloadKey]);

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onMouseDown={(event) => {
                    if (
                        event.target === event.currentTarget &&
                        !showEditForm
                    ) {
                        onClose();
                    }
                }}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="patient-details-title"
                    className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-line bg-white shadow-xl"
                >
                    <div className="flex items-center justify-between border-b border-line px-6 py-5">
                        <div>
                            <h2
                                id="patient-details-title"
                                className="text-lg font-semibold text-ink"
                            >
                                Patient Profile
                            </h2>

                            <p className="mt-1 text-xs text-muted">
                                Patient information and medical activity.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close patient profile"
                            className="rounded-md p-2 text-muted hover:bg-slate-100"
                        >
                            <X size={19} />
                        </button>
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <p className="py-12 text-center text-sm text-muted">
                                Loading patient profile...
                            </p>
                        ) : error ? (
                            <div
                                role="alert"
                                className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        ) : patient ? (
                            <div className="space-y-7">
                                {/* Patient heading */}
                                <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-primary">
                                            <UserRound size={24} />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-ink">
                                                {patient.firstName} {patient.lastName}
                                            </h3>

                                            <p className="mt-1 text-sm text-muted">
                                                {patient.patientNumber}
                                            </p>
                                        </div>
                                    </div>

                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => setShowEditForm(true)}
                                            className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
                                        >
                                            <Pencil size={15} />
                                            Edit Patient
                                        </button>
                                    )}
                                </section>

                                {/* Personal information */}
                                <section>
                                    <h3 className="mb-4 text-sm font-semibold text-ink">
                                        Personal Information
                                    </h3>

                                    <div className="grid grid-cols-1 gap-5 rounded-lg border border-line p-5 sm:grid-cols-3">
                                        <InfoField
                                            label="First Name"
                                            value={patient.firstName}
                                        />

                                        <InfoField
                                            label="Last Name"
                                            value={patient.lastName}
                                        />

                                        <InfoField
                                            label="Date of Birth"
                                            value={formatDate(patient.dateOfBirth)}
                                        />

                                        <InfoField
                                            label="Sex"
                                            value={patient.sex}
                                        />

                                        <InfoField
                                            label="Patient Number"
                                            value={patient.patientNumber}
                                        />

                                        <InfoField
                                            label="Registered On"
                                            value={formatDate(patient.createdAt)}
                                        />
                                    </div>
                                </section>

                                {/* Contact information */}
                                <section>
                                    <h3 className="mb-4 text-sm font-semibold text-ink">
                                        Contact Information
                                    </h3>

                                    <div className="grid grid-cols-1 gap-5 rounded-lg border border-line p-5 sm:grid-cols-2">
                                        <InfoField
                                            label="Phone Number"
                                            value={patient.phone}
                                        />

                                        <InfoField
                                            label="Email Address"
                                            value={patient.email}
                                        />

                                        <div className="sm:col-span-2">
                                            <InfoField
                                                label="Address"
                                                value={patient.address}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Appointment history */}
                                <section>
                                    <div className="mb-4 flex items-center gap-2">
                                        <CalendarDays
                                            size={18}
                                            className="text-muted"
                                        />

                                        <h3 className="text-sm font-semibold text-ink">
                                            Appointment History
                                        </h3>

                                        <span className="text-xs text-muted">
                                            ({patient.appointments?.length || 0})
                                        </span>
                                    </div>

                                    {patient.appointments?.length ? (
                                        <div className="overflow-x-auto rounded-lg border border-line">
                                            <table className="w-full min-w-[600px] text-left">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Date & Time
                                                        </th>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Procedure
                                                        </th>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Modality
                                                        </th>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-line">
                                                    {patient.appointments.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="px-4 py-3 text-sm text-ink">
                                                                {formatDateTime(item.scheduledAt)}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-ink">
                                                                {item.procedure}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-muted">
                                                                {item.modality}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-muted">
                                                                {item.status}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="rounded-lg border border-line bg-slate-50 p-5 text-center text-sm text-muted">
                                            No appointments recorded.
                                        </p>
                                    )}
                                </section>

                                {/* Radiology history */}
                                <section>
                                    <div className="mb-4 flex items-center gap-2">
                                        <ClipboardList
                                            size={18}
                                            className="text-muted"
                                        />

                                        <h3 className="text-sm font-semibold text-ink">
                                            Radiology Orders
                                        </h3>

                                        <span className="text-xs text-muted">
                                            ({patient.orders?.length || 0})
                                        </span>
                                    </div>

                                    {patient.orders?.length ? (
                                        <div className="overflow-x-auto rounded-lg border border-line">
                                            <table className="w-full min-w-[650px] text-left">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Accession Number
                                                        </th>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Procedure
                                                        </th>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Modality
                                                        </th>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Priority
                                                        </th>
                                                        <th className="px-4 py-3 text-xs font-semibold text-muted">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-line">
                                                    {patient.orders.map((order) => (
                                                        <tr key={order.id}>
                                                            <td className="px-4 py-3 text-sm font-medium text-ink">
                                                                {order.accessionNo}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-ink">
                                                                {order.procedure}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-muted">
                                                                {order.modality}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-muted">
                                                                {order.priority}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-muted">
                                                                {order.status}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="rounded-lg border border-line bg-slate-50 p-5 text-center text-sm text-muted">
                                            No radiology orders recorded.
                                        </p>
                                    )}
                                </section>
                            </div>
                        ) : null}
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

            {showEditForm && patient && (
                <PatientForm
                    patient={patient}
                    onCancel={() => setShowEditForm(false)}
                    onUpdated={() => {
                        setShowEditForm(false);
                        setReloadKey((current) => current + 1);
                        onUpdated?.();
                    }}
                />
            )}
        </>
    );
}

export default PatientDetails;
