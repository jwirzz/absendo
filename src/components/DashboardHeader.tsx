import { useCallback, useEffect, useState } from 'react';
import NewAbsenceModal from "./NewAbsenceModal.tsx";
import { useUserProfile } from "../contexts/UserProfileContext.tsx";

function DashboardHeader() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, profile, refreshProfile } = useUserProfile();

    // Über Navbar-Button, N-Shortcut oder #neue-absenz-Hash öffnen
    useEffect(() => {
        const open = () => { setIsModalOpen(true); void refreshProfile(); };
        const fromHash = () => {
            if (window.location.hash === "#neue-absenz") {
                history.replaceState(null, "", window.location.pathname + window.location.search);
                open();
            }
        };
        window.addEventListener("absendo:new-absence", open);
        window.addEventListener("hashchange", fromHash);
        fromHash();
        return () => {
            window.removeEventListener("absendo:new-absence", open);
            window.removeEventListener("hashchange", fromHash);
        };
    }, [refreshProfile]);

    const isFullNameEnabled = profile?.isFullNameEnabled ?? false;
    const isFullSubjectEnabled = profile?.isFullSubjectEnabled ?? false;
    const isDoNotSaveEnabled = profile?.isDoNotSaveEnabled ?? false;

    const firstName = profile?.first_name?.trim() || "";
    const initials = `${profile?.first_name?.charAt(0) ?? ""}${profile?.last_name?.charAt(0) ?? ""}`.toUpperCase() || "NN";

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        window.dispatchEvent(new Event('absendo:refresh-dashboard'));
    }, []);

    return (
        <div className="mx-auto max-w-7xl px-6 pt-8">
            <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-lg font-bold text-secondary-content">{initials}</div>
                <div>
                    <h1 className="display-md">Hallo {firstName || "zusammen"} 👋</h1>
                    <p className="mt-1 text-sm text-base-content/60">Bereit für die nächste Absenz.</p>
                </div>
            </div>

            <NewAbsenceModal
                isOpen={isModalOpen}
                onClose={closeModal}
                user={user}
                userData={profile}
                isFullNameEnabled={isFullNameEnabled}
                isFullSubjectEnabled={isFullSubjectEnabled}
                isDoNotSaveEnabled={isDoNotSaveEnabled}
            />
        </div>
    );
}

export default DashboardHeader;
