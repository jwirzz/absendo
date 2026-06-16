
interface E2EEModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const E2EEModal = ({ isOpen, onClose }: E2EEModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
                <h2 className="text-2xl font-bold text-center mb-4">Hinweis zur Sicherheit</h2>
                <p className="text-center text-gray-700 mb-6">
                    Ab sofort sind alle deine Daten <strong>End-to-End verschlüsselt</strong>.
                    Das bedeutet: Nur du kannst darauf zugreifen. Wir haben keine Einsicht.
                    Ohne deine PIN kann niemand, auch du nicht, die Daten wiederherstellen.
                </p>

                <div className="flex justify-center">
                    <button
                        className="btn btn-primary"
                        onClick={onClose}
                    >
                        Alles klar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default E2EEModal;
