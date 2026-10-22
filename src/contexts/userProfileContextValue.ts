import { createContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "../types/userProfile";

export interface UserProfileContextValue {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    updateProfileFields: (fields: Partial<UserProfile>) => Promise<void>;
}

export const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);
