
import { useEffect, useState } from "react";
import { FilePlus2, X } from "lucide-react";
import api from "../../services/api";

function ReportForm({ report = null, onCreated, onUpdated, onCancel }) {
    const isEditing = Boolean(report);

    const [orders, setOrders] = useState([]);
    const [orderId, setOrderId] = useState(report?.orderId || "");
    const [findings, setFindings] = useState(report?.findings || "");
    const [impression, setImpression] = useState(report?.impression || "");

    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isEditing) return;

        let active = true;

        async function loadCompletedOrders() {
            setIsLoadingOrders(true);

            try {
                const response = await api.get("/radiology-orders", {
                    params: {
                        page: 1,
                        limit: 100,
                        status: "COMPLETED",
                    },
                });

                if (active) {
                    setOrders(
                        (response.data.data || []).filter(
                            (order) => !order.report
                        )
                    );
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load completed examinations."
                    );
                }
            } finally {
                if (active) setIsLoadingOrders(false);
            }
        }

        loadCompletedOrders();

        return () => {
            active = false;
        };
    }, [isEditing]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!isEditing && !orderId) {
            setError("Please select a completed examination.");
            return;
        }

        const payload = {
            findings: findings.trim(),
            impression: impression.trim(),
        };

        setIsSubmitting(true);

        try {
            if (isEditing) {
                const response = await api.patch(
                    `/radiology-reports/${report.id}`,
                    payload
                );

                onUpdated(response.data.data);
            } else {
                const response = await api.post(
                    "/radiology-reports",
                    {
                        orderId,
                        ...payload,
                    }
                );

                onCreated(response.data.data);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save the radiology report."
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
                aria-labelledby="report-form-title"
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-line bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                            <FilePlus2 size={20} />
                        </div>

                        <div>
                            <h2
                                id="report-form-title"
                                className="text-lg font-semibold text-ink"
                            >
                                {isEditing ? "Edit Draft Report" : "Create Radiology Report"}
                            </h2>

                            <p className="mt-0.5 text-xs text-muted">
                                {isEditing
                                    ? "Update the findings and impression."
                                    : "Select a completed examination and enter report details."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        aria-label="Close report editor"
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
                                Examination
                            </h3>

                            {isEditing ? (
                                <div className="rounded-md border border-line bg-slate-50 p-4">
                                    <p className="text-sm font-medium text-ink">
                                        {report.order?.procedure || "Radiology examination"}
                                    </p>

                                    <p className="mt-1 text-xs text-muted">
                                        Accession Number:{" "}
                                        {report.order?.accessionNo || "—"}
                                    </p>

                                    <p className="mt-1 text-xs text-muted">
                                        Patient:{" "}
                                        {report.order?.patient?.firstName}{" "}
                                        {report.order?.patient?.lastName}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="reportOrder" className={labelClass}>
                                        Completed Examination *
                                    </label>

                                    <select
                                        id="reportOrder"
                                        value={orderId}
                                        onChange={(event) => setOrderId(event.target.value)}
                                        disabled={isLoadingOrders}
                                        required
                                        className={inputClass}
                                    >
                                        <option value="">
                                            {isLoadingOrders
                                                ? "Loading completed examinations..."
                                                : "Select an examination"}
                                        </option>

                                        {orders.map((order) => (
                                            <option
                                                key={order.id}
                                                value={order.id}
                                            >
                                                {order.accessionNo}
                                                {" · "}
                                                {order.patient?.firstName}{" "}
                                                {order.patient?.lastName}
                                                {" · "}
                                                {order.procedure}
                                                {" · "}
                                                {order.modality}
                                            </option>
                                        ))}
                                    </select>

                                    {!isLoadingOrders && orders.length === 0 && (
                                        <p className="mt-2 text-xs text-muted">
                                            No completed examinations without an existing report are available.
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>

                        <div className="border-t border-line" />

                        <section>
                            <h3 className="mb-4 text-sm font-semibold text-ink">
                                Report Content
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="reportFindings" className={labelClass}>
                                        Findings *
                                    </label>

                                    <textarea
                                        id="reportFindings"
                                        value={findings}
                                        onChange={(event) => setFindings(event.target.value)}
                                        maxLength={10000}
                                        rows={8}
                                        placeholder="Enter examination findings..."
                                        className={inputClass}
                                    />

                                    <p className="mt-1 text-right text-xs text-muted">
                                        {findings.length}/10000
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="reportImpression" className={labelClass}>
                                        Impression *
                                    </label>

                                    <textarea
                                        id="reportImpression"
                                        value={impression}
                                        onChange={(event) => setImpression(event.target.value)}
                                        maxLength={5000}
                                        rows={5}
                                        placeholder="Enter the final clinical impression..."
                                        className={inputClass}
                                    />

                                    <p className="mt-1 text-right text-xs text-muted">
                                        {impression.length}/5000
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                            Reports must contain complete findings and impression before they can be reviewed. Clinical content must be entered and verified by an authorized radiologist.
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
                            disabled={isSubmitting || (!isEditing && (!orderId || isLoadingOrders))}
                            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Saving..."
                                : isEditing
                                    ? "Save Draft"
                                    : "Create Draft Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReportForm;
