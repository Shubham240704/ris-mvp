
function ModulePlaceholder({ title }) {
    return (
        <div className="rounded-lg border border-line bg-surface p-8">
            <h2 className="text-xl font-semibold text-ink">
                {title}
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
                The page layout is ready. We will connect this module
                to the existing RIS backend in the upcoming integration
                steps.
            </p>
        </div>
    );
}

export default ModulePlaceholder;
