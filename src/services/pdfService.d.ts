interface formData {
    date: string,
    reason:string,
    fileName: string,
    is_excused: boolean,
    isFullNameEnabled: boolean,
    isFullSubjectEnabled: boolean,
    isDoNotSaveEnabled: boolean,
    selectedLessonKeys?: string[],
}
export declare function generatePdf(userData, formData: formData): Promise<Blob>;
export interface AbsenceOption {
    key: string,
    datum: string,
    fach: string,
    lehrer: string,
    klasse: string,
    count: number,
}
export declare function getAbsenceOptions(userData, dateValue: string): Promise<AbsenceOption[]>;
