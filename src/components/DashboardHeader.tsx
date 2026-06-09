import { useCallback, useState } from 'react';
import NewAbsenceModal from "./NewAbsenceModal.tsx";
import { useUserProfile } from "../contexts/UserProfileContext.tsx";

function DashboardHeader() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, profile, refreshProfile } = useUserProfile();

    const isFullNameEnabled = profile?.isFullNameEnabled ?? false;
    const isFullSubjectEnabled = profile?.isFullSubjectEnabled ?? false;
    const isDoNotSaveEnabled = profile?.isDoNotSaveEnabled ?? false;

    const openModal = async () => {
        await refreshProfile();
        setIsModalOpen(true);
    };

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        window.dispatchEvent(new Event('absendo:refresh-dashboard'));
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap">
                <h1 className="text-2xl font-bold">Absendo Dashboard</h1>
                <button className="btn btn-primary btn-xl sm:mt-0 mt-4" onClick={openModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor" className="w-6 h-6 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                    </svg>
                    Neue Absenz
                </button>
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
