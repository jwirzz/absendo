import { useCallback, useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import EncryptionService from "../services/encryptionService";
import { UserProfile } from "../types/userProfile";
import { UserProfileContext, type UserProfileContextValue } from "./userProfileContextValue";

interface UserProfileProviderProps {
    user: User | null;
    children: React.ReactNode;
}

export function UserProfileProvider({ user, children }: UserProfileProviderProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const encryptionService = useMemo(() => EncryptionService.getInstance(), []);

    const refreshProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;

            const decryptedData = await encryptionService.decryptProfileData(data) as unknown as UserProfile;

            if (encryptionService.profileNeedsMigration(data)) {
                const migratedProfile = await encryptionService.encryptProfileData({
                    ...decryptedData,
                    id: user.id,
                } as Record<string, unknown>);
                const { error: migrationError } = await supabase
                    .from("profiles")
                    .update(migratedProfile)
                    .eq("id", user.id);
                if (migrationError) {
                    console.error("Profile encryption migration failed:", migrationError);
                }
            }
            setProfile(decryptedData);
        } catch (fetchError) {
            const message = fetchError instanceof Error ? fetchError.message : "Profil konnte nicht geladen werden";
            setError(message);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [encryptionService, user]);

    const updateProfileFields = useCallback(async (fields: Partial<UserProfile>) => {
        if (!user) {
            throw new Error("User not available");
        }

        const { data, error: fetchError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        const currentProfile = await encryptionService.decryptProfileData(data) as unknown as UserProfile;
        const updatedProfile: UserProfile = {
            ...currentProfile,
            ...fields,
            id: user.id,
        };

        const encryptedUpdate = await encryptionService.encryptProfileData(updatedProfile as Record<string, unknown>);

        const { error: updateError } = await supabase
            .from("profiles")
            .update(encryptedUpdate)
            .eq("id", user.id);

        if (updateError) {
            throw updateError;
        }

        // Update local state with the merged, decrypted profile
        setProfile(updatedProfile);
    }, [user, encryptionService]);

    useEffect(() => {
        void refreshProfile();
    }, [refreshProfile]);

    const contextValue = useMemo<UserProfileContextValue>(() => ({
        user,
        profile,
        loading,
        error,
        refreshProfile,
        updateProfileFields,
    }), [user, profile, loading, error, refreshProfile, updateProfileFields]);

    return (
        <UserProfileContext.Provider value={contextValue}>
            {children}
        </UserProfileContext.Provider>
    );
}
