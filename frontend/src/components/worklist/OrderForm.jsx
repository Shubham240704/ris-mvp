
import { useEffect, useState } from "react";
import { X, ClipboardPlus } from "lucide-react";
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

const priorities = ["ROUTINE", "URGENT", "STAT"];

function formatDateTime(value) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(new Date(value));
}

function OrderForm({ onCreated, onCancel }) {
    const [patientSearch, setPatientSearch] = useState("");
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [appointments, setAppointments] = useState([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

    const [form, setForm] = useState({
        appointmentId: "",
        modality: "XRAY",
        procedure: "",
        priority: "ROUTINE",
        clinicalNote: "",
    });

    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Search existing patients.
    useEffect(() => {
        let active = true;

        if (selectedPatient || !patientSearch.trim()) {
            setPatients([]);
            return undefined;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);

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
                if (active) setIsSearching(false);
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [patientSearch, selectedPatient]);

    // Load appointments belonging to the selected patient.
    useEffect(() => {
        let active = true;

        async function loadAppointments() {
            if (!selectedPatient) {
                setAppointments([]);
                return;
            }

            setIsLoadingAppointments(true);

            try {
                const response = await api.get("/appointments", {
                    params: {
                        page: 1,
                        limit: 100,
                        patientId: selectedPatient.id,
                    },
                });

                if (active) {
                    setAppointments(
                        (response.data.data || []).filter((item) =>
                            ["SCHEDULED", "CONFIRMED", "CHECKED_IN"]
                                .includes(item.status)
                        )
                    );
                }
            } catch {
                if (active) setAppointments([]);
            } finally {
                if (active) setIsLoadingAppointments(false);
            }
        }

        loadAppointments();

        return () => {
            active = false;
        };
    }, [selectedPatient]);

    function handleChange(event) {
        const { name, value } = event.target;

        if (name === "appointmentId") {
            const selectedAppointment = appointments.find(
                (item) => item.id === value
            );

            setForm((current) => ({
                ...current,
                appointmentId: value,
                ...(selectedAppointment
                    ? {
                        modality: selectedAppointment.modality,
                        procedure: selectedAppointment.procedure,
                    }
                    : {}),
            }));

            return;
        }

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handlePatientSelect(patient) {
        setSelectedPatient(patient);
        setPatients([]);
        setPatientSearch(
            `${patient.firstName} ${patient.lastName} · ${patient.patientNumber}`
        );

        setForm({
            appointmentId: "",
            modality: "XRAY",
            procedure: "",
            priority: "ROUTINE",
            clinicalNote: "",
        });

        setError("");
    }

    function clearPatient() {
        setSelectedPatient(null);
        setPatientSearch("");
        setAppointments([]);

        setForm({
            appointmentId: "",
            modality: "XRAY",
            procedure: "",
            priority: "ROUTINE",
            clinicalNote: "",
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!selectedPatient) {
            setError("Please select an existing patient.");
            return;
        }

        const payload = {
            patientId: selectedPatient.id,
            modality: form.modality,
            procedure: form.procedure.trim(),
            priority: form.priority,
        };

        if (form.appointmentId) {
            payload.appointmentId = form.appointmentId;
        }

        if (form.clinicalNote.trim()) {
            payload.clinicalNote = form.clinicalNote.trim();
        }

        setIsSubmitting(true);

        try {
            const response = await api.post("/radiology-orders", payload);
            onCreated(response.data.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create radiology order."
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
                aria-labelledby="order-form-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                            <ClipboardPlus size={20} />
                        </div>

                        <div>
                            <h2
                                id="order-form-title"
                                className="text-lg font-semibold text-ink"
                            >
                                Create Radiology Order
                            </h2>
                            <p className="mt-0.5 text-xs text-muted">
                                Create an examination order for a registered patient.
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

                            <label htmlFor="orderPatientSearch" className={labelClass}>
                                Select Patient *
                            </label>

                            <input
                                id="orderPatientSearch"
                                value={patientSearch}
                                onChange={(event) => {
                                    setPatientSearch(event.target.value);
                                    setSelectedPatient(null);
                                    setForm((current) => ({
                                        ...current,
                                        appointmentId: "",
                                    }));
                                }}
                                placeholder="Search by name or patient number..."
                                className={inputClass}
                            />

                            {isSearching && (
                                <p className="mt-2 text-xs text-muted">
                                    Searching patients...
                                </p>
                            )}

                            {patients.length > 0 && (
                                <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-line">
                                    {patients.map((patient) => (
                                        <button
                                            key={patient.id}
                                            type="button"
                                            onClick={() => handlePatientSelect(patient)}
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

                            {selectedPatient && (
                                <div className="mt-3 flex items-center justify-between rounded-md bg-blue-50 p-3">
                                    <div>
                                        <p className="text-sm font-medium text-ink">
                                            {selectedPatient.firstName}{" "}
                                            {selectedPatient.lastName}
                                        </p>
                                        <p className="mt-1 text-xs text-muted">
                                            {selectedPatient.patientNumber}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={clearPatient}
                                        className="text-xs font-medium text-primary hover:underline"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                        </section>

                        <div className="border-t border-line" />

                        <section>
                            <h3 className="mb-4 text-sm font-semibold text-ink">
                                Examination Details
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="appointmentId" className={labelClass}>
                                        Link Appointment (Optional)
                                    </label>

                                    <select
                                        id="appointmentId"
                                        name="appointmentId"
                                        value={form.appointmentId}
                                        onChange={handleChange}
                                        disabled={!selectedPatient || isLoadingAppointments}
                                        className={inputClass}
                                    >
                                        <option value="">
                                            {isLoadingAppointments
                                                ? "Loading appointments..."
                                                : "No linked appointment"}
                                        </option>

                                        {appointments.map((appointment) => (
                                            <option
                                                key={appointment.id}
                                                value={appointment.id}
                                            >
                                                {formatDateTime(appointment.scheduledAt)}
                                                {" · "}
                                                {appointment.procedure}
                                                {" · "}
                                                {appointment.modality}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="mt-1 text-xs text-muted">
                                        Selecting an appointment automatically fills its modality and procedure.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="orderModality" className={labelClass}>
                                        Modality *
                                    </label>

                                    <select
                                        id="orderModality"
                                        name="modality"
                                        value={form.modality}
                                        onChange={handleChange}
                                        disabled={Boolean(form.appointmentId)}
                                        required
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
                                    <label htmlFor="orderProcedure" className={labelClass}>
                                        Procedure *
                                    </label>

                                    <input
                                        id="orderProcedure"
                                        name="procedure"
                                        value={form.procedure}
                                        onChange={handleChange}
                                        maxLength={150}
                                        required
                                        placeholder="e.g. MRI Brain"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="orderPriority" className={labelClass}>
                                        Priority *
                                    </label>

                                    <select
                                        id="orderPriority"
                                        name="priority"
                                        value={form.priority}
                                        onChange={handleChange}
                                        className={inputClass}
                                    >
                                        <option value="ROUTINE">Routine</option>
                                        <option value="URGENT">Urgent</option>
                                        <option value="STAT">STAT</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="clinicalNote" className={labelClass}>
                                        Clinical Notes
                                    </label>

                                    <textarea
                                        id="clinicalNote"
                                        name="clinicalNote"
                                        value={form.clinicalNote}
                                        onChange={handleChange}
                                        maxLength={2000}
                                        rows={3}
                                        placeholder="Enter relevant clinical information..."
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </section>

                        <p className="text-xs text-muted">
                            The accession number will be generated automatically.
                        </p>
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
                            disabled={isSubmitting || !selectedPatient}
                            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Creating Order..." : "Create Order"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OrderForm;
