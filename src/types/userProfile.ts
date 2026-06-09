export interface UserProfile {
    id?: string;
    first_name?: string;
    last_name?: string;
    birthday?: string;
    calendar_url?: string;
    first_name_trainer?: string;
    last_name_trainer?: string;
    phone_number_trainer?: string;
    email_trainer?: string;
    isFullNameEnabled?: boolean;
    isFullSubjectEnabled?: boolean;
    isDoNotSaveEnabled?: boolean;
    total_absences?: number;
    time_saved_minutes?: number;
}
