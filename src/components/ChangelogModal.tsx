interface ChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
    return (
        <dialog
            className={`modal ${isOpen ? "modal-open" : ""}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="modal-box w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-primary/10 p-2 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </span>
                        <h3 className="font-bold text-xl">Neueste Änderungen</h3>
                    </div>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <article className="card border border-base-300 bg-base-200 shadow-sm">
                        <div className="card-body p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-lg">v2.0.0</h4>
                                <span className="badge badge-primary badge-outline">Neu</span>
                            </div>
                            <ul className="space-y-2 text-base-content/80">
                                <li className="flex items-start gap-2">
                                    <span className="rounded-lg bg-success/20 p-1 text-success mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    <span>Einzelne Lektionen auswählbar - du musst nicht mehr den ganzen Tag erfassen</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="rounded-lg bg-info/20 p-1 text-info mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </span>
                                    <span>Performance-Verbesserungen für schnelleres Laden</span>
                                </li>
                            </ul>
                        </div>
                    </article>
                </div>

                <div className="modal-action mt-6">
                    <button className="btn btn-primary" onClick={onClose}>
                        Verstanden
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export default ChangelogModal;

