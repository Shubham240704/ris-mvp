
import { useState } from "react";
import { UserPlus, UserRoundPen, X } from "lucide-react";
import api from "../../services/api";

function getLocalDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDateValue(value) {
    if (!value) return "";
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? ""
        : date.toISOString().slice(0, 10);
}

function getInitialForm(patient) {
    return {
        firstName: patient?.firstName || "",
        lastName: patient?.lastName || "",
        dateOfBirth: getDateValue(patient?.dateOfBirth),
        sex: patient?.sex || "",
        phone: patient?.phone || "",
        email: patient?.email || "",
        address: patient?.address || "",
    };
}

function PatientForm({ onCreated, onUpdated, onCancel, patient = null }) {
    const isEditing = Boolean(patient);

    const [form, setForm] = useState(() => getInitialForm(patient));
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

        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            dateOfBirth: form.dateOfBirth,
            phone: form.phone.trim(),
            address: form.address.trim(),
        };

        // Optional fields are only sent when provided.
        if (form.sex) payload.sex = form.sex;
        if (form.email.trim()) payload.email = form.email.trim();

        setIsSubmitting(true);

        try {
            if (isEditing) {
                const response = await api.patch(
                    `/patients/${patient.id}`,
                    payload
                );

                onUpdated(response.data.data);
            } else {
                const response = await api.post("/patients", payload);
                onCreated(response.data.data);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                `Unable to ${isEditing ? "update" : "register"} patient. Please try again.`
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
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSubmitting
                ) {
                    onCancel();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="patient-form-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                            {isEditing ? (
                                <UserRoundPen size={20} />
                            ) : (
                                <UserPlus size={20} />
                            )}
                        </div>

                        <div>
                            <h2
                                id="patient-form-title"
                                className="text-lg font-semibold text-ink"
                            >
                                {isEditing ? "Edit Patient" : "Register New Patient"}
                            </h2>

                            <p className="mt-0.5 text-xs text-muted">
                                {isEditing
                                    ? "Update patient demographic and contact information."
                                    : "Enter the patient's information."}
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
                                className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        {isEditing && (
                            <div className="rounded-md bg-slate-50 p-3 text-sm text-muted">
                                Patient Number:{" "}
                                <span className="font-semibold text-ink">
                                    {patient.patientNumber}
                                </span>
                                <p className="mt-1 text-xs">
                                    The patient number cannot be changed.
                                </p>
                            </div>
                        )}

                        <section>
                            <h3 className="mb-4 text-sm font-semibold text-ink">
                                Personal Information
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="firstName" className={labelClass}>
                                        First Name *
                                    </label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        maxLength={100}
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="lastName" className={labelClass}>
                                        Last Name *
                                    </label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        maxLength={100}
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="dateOfBirth" className={labelClass}>
                                        Date of Birth *
                                    </label>
                                    <input
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={form.dateOfBirth}
                                        onChange={handleChange}
                                        max={getLocalDate()}
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="sex" className={labelClass}>
                                        Sex
                                    </label>
                                    <select
                                        id="sex"
                                        name="sex"
                                        value={form.sex}
                                        onChange={handleChange}
                                        className={inputClass}
                                    >
                                        <option value="">Select</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-line" />

                        <section>
                            <h3 className="mb-4 text-sm font-semibold text-ink">
                                Contact Information
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="phone" className={labelClass}>
                                        Phone Number
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleChange}
                                        maxLength={30}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className={labelClass}>
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        maxLength={254}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="address" className={labelClass}>
                                        Address
                                    </label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        maxLength={500}
                                        rows={3}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </section>

                        <p className="text-xs text-muted">
                            * Required fields.
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-line bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="rounded-md border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-slate-100 disabled:opacity-50"
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
                                    : "Register Patient"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PatientForm;
