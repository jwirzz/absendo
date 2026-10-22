import { useContext } from "react";
import { UserProfileContext, type UserProfileContextValue } from "./userProfileContextValue";

export function useUserProfile(): UserProfileContextValue {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error("useUserProfile must be used inside UserProfileProvider");
    }
    return context;
}
