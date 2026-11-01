
import { useEffect, useState } from "react";
import { X, CalendarPlus } from "lucide-react";
import api from "../../services/api";

const modalities = [
    "XRAY",
    "CT",
    "MRI",
    "ULTRASOUND",
    "MAMMOGRAPHY",
    "PET_CT",
    "OTHER",
];

function toLocalDateTime(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getInitialForm(appointment) {
    return {
        patientId: appointment?.patientId || "",
        scheduledAt: toLocalDateTime(appointment?.scheduledAt),
        modality: appointment?.modality || "XRAY",
        procedure: appointment?.procedure || "",
        location: appointment?.location || "",
        notes: appointment?.notes || "",
    };
}

function AppointmentForm({ appointment = null, onCreated, onUpdated, onCancel }) {
    const isEditing = Boolean(appointment);

    const [form, setForm] = useState(() => getInitialForm(appointment));
    const [patients, setPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(
        appointment?.patient || null
    );
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isEditing) return;

        let active = true;

        async function searchPatients() {
            if (!patientSearch.trim()) {
                setPatients([]);
                return;
            }

            setIsLoadingPatients(true);

            try {
                const response = await api.get("/patients", {
                    params: {
                        page: 1,
                        limit: 10,
                        search: patientSearch.trim(),
                    },
                });

                if (active) {
                    setPatients(response.data.data || []);
                }
            } catch {
                if (active) setPatients([]);
            } finally {
                if (active) setIsLoadingPatients(false);
            }
        }

        const timer = setTimeout(searchPatients, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [patientSearch, isEditing]);

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

        if (!isEditing && !form.patientId) {
            setError("Please select a patient.");
            return;
        }

        const scheduledDate = new Date(form.scheduledAt);

        if (Number.isNaN(scheduledDate.getTime()) ||
            scheduledDate <= new Date()) {
            setError("Please select a future appointment date and time.");
            return;
        }

        const payload = {
            scheduledAt: scheduledDate.toISOString(),
            modality: form.modality,
            procedure: form.procedure.trim(),
            location: form.location.trim(),
            notes: form.notes.trim(),
        };

        if (!payload.location) delete payload.location;
        if (!payload.notes) delete payload.notes;

        setIsSubmitting(true);

        try {
            if (isEditing) {
                const response = await api.patch(
                    `/appointments/${appointment.id}`,
                    payload
                );

                onUpdated(response.data.data);
            } else {
                const response = await api.post("/appointments", {
                    ...payload,
                    patientId: form.patientId,
                });

                onCreated(response.data.data);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save appointment."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputClass =
        "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-ink";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-form-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                            <CalendarPlus size={20} />
                        </div>

                        <div>
                            <h2
                                id="appointment-form-title"
                                className="text-lg font-semibold text-ink"
                            >
                                {isEditing ? "Reschedule Appointment" : "Schedule Appointment"}
                            </h2>
                            <p className="mt-0.5 text-xs text-muted">
                                Enter the examination appointment details.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        aria-label="Close form"
                        className="rounded-md p-2 text-muted hover:bg-slate-100"
                    >
                        <X size={19} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 p-6">
                        {error && (
                            <div
                                role="alert"
                                className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        <section>
                            <h3 className="mb-4 text-sm font-semibold text-ink">
                                Patient Information
                            </h3>

                            {isEditing ? (
                                <div className="rounded-md border border-line bg-slate-50 p-3">
                                    <p className="text-sm font-medium text-ink">
                                        {selectedPatient?.firstName}{" "}
                                        {selectedPatient?.lastName}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        {selectedPatient?.patientNumber}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <label htmlFor="patientSearch" className={labelClass}>
                                        Search Existing Patient *
                                    </label>

                                    <input
                                        id="patientSearch"
                                        value={patientSearch}
                                        onChange={(event) => {
                                            setPatientSearch(event.target.value);
                                            setSelectedPatient(null);
                                            setForm((current) => ({
                                                ...current,
                                                patientId: "",
                                            }));
                                        }}
                                        placeholder="Search by patient name or patient number..."
                                        className={inputClass}
                                    />

                                    {isLoadingPatients && (
                                        <p className="mt-2 text-xs text-muted">
                                            Searching patients...
                                        </p>
                                    )}

                                    {patients.length > 0 && !selectedPatient && (
                                        <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-line">
                                            {patients.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPatient(patient);
                                                        setForm((current) => ({
                                                            ...current,
                                                            patientId: patient.id,
                                                        }));
                                                        setPatientSearch(
                                                            `${patient.firstName} ${patient.lastName} · ${patient.patientNumber}`
                                                        );
                                                        setPatients([]);
                                                    }}
                                                    className="block w-full border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-slate-50"
                                                >
                                                    <p className="text-sm font-medium text-ink">
                                                        {patient.firstName} {patient.lastName}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted">
                                                        {patient.patientNumber}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {!isLoadingPatients &&
                                        patientSearch.trim() &&
                                        patients.length === 0 &&
                                        !selectedPatient && (
                                            <p className="mt-2 text-xs text-muted">
                                                No matching patients found.
                                            </p>
                                        )}

                                    {selectedPatient && (
                                        <div className="mt-2 flex items-center justify-between rounded-md bg-blue-50 p-3">
                                            <div>
                                                <p className="text-sm font-medium text-ink">
                                                    {selectedPatient.firstName}{" "}
                                                    {selectedPatient.lastName}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {selectedPatient.patientNumber}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPatient(null);
                                                    setPatientSearch("");
                                                    setForm((current) => ({
                                                        ...current,
                                                        patientId: "",
                                                    }));
                                                }}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>

                        <div className="border-t border-line" />

                        <section>
                            <h3 className="mb-4 text-sm font-semibold text-ink">
                                Appointment Details
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="scheduledAt" className={labelClass}>
                                        Date and Time *
                                    </label>
                                    <input
                                        id="scheduledAt"
                                        name="scheduledAt"
                                        type="datetime-local"
                                        min={toLocalDateTime(new Date())}
                                        value={form.scheduledAt}
                                        onChange={handleChange}
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="modality" className={labelClass}>
                                        Modality *
                                    </label>
                                    <select
                                        id="modality"
                                        name="modality"
                                        value={form.modality}
                                        onChange={handleChange}
                                        className={inputClass}
                                    >
                                        {modalities.map((modality) => (
                                            <option key={modality} value={modality}>
                                                {modality.replace("_", " ")}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="procedure" className={labelClass}>
                                        Procedure *
                                    </label>
                                    <input
                                        id="procedure"
                                        name="procedure"
                                        value={form.procedure}
                                        onChange={handleChange}
                                        maxLength={150}
                                        required
                                        placeholder="e.g. MRI Brain"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="location" className={labelClass}>
                                        Location / Room
                                    </label>
                                    <input
                                        id="location"
                                        name="location"
                                        value={form.location}
                                        onChange={handleChange}
                                        maxLength={150}
                                        placeholder="e.g. MRI Room 1"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="notes" className={labelClass}>
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleChange}
                                        maxLength={1000}
                                        rows={3}
                                        placeholder="Additional appointment notes"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </section>
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
                            {isSubmitting
                                ? "Saving..."
                                : isEditing
                                    ? "Save Changes"
                                    : "Schedule Appointment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AppointmentForm;
