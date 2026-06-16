import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.tsx";
import DashboardHeader from "../components/DashboardHeader.tsx";
import DashboardLastAbsences from "../components/DashboardContent.tsx";
import AuthWrapper from "../components/AuthWrapper.tsx";
import { supabase } from "../supabaseClient.ts";
import {User} from "@supabase/supabase-js";
import { UserProfileProvider } from "../contexts/UserProfileContext.tsx";

function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        }
        fetchUser();
    }, []);

    useEffect(() => {
        const checkLogin = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', user?.id)
                    .single();

                if (!data?.onboarding_completed && window.location.pathname !== "/welcome") {
                    console.log("User is not onboarded");
                    window.location.href = "/welcome";
                }
            }
        };

        checkLogin();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    const DashboardContent = () => (
        <div className="min-h-screen bg-base-200/40 flex flex-col">
            <Navbar />
            <main className="flex-1">
                <DashboardHeader />
                <DashboardLastAbsences />
            </main>
        </div>
    );

    return user ? (
        <AuthWrapper user={user}>
            <UserProfileProvider user={user}>
                <DashboardContent />
            </UserProfileProvider>
        </AuthWrapper>
    ) : (
        <div className="min-h-screen bg-base-100 flex flex-col">
            <Navbar />
            <main className="flex flex-1 items-center justify-center px-4 py-10">
                <div className="card w-full max-w-xl border border-base-300 bg-base-100 shadow-sm">
                    <div className="card-body items-center text-center">
                        <h1 className="text-2xl font-bold">Du bist nicht eingeloggt</h1>
                        <p className="text-base-content/80">
                            Melde dich an, um auf dein Dashboard und deine Absenzen zuzugreifen.
                        </p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <a href="/login" className="btn btn-primary">Jetzt einloggen</a>
                            <a href="/signup" className="btn btn-ghost">Konto erstellen</a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
