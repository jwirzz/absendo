import Navbar from "../components/Navbar.tsx";
import {supabase } from "../supabaseClient.ts";
import {ProfilePage} from "../components/ProfilePage.tsx";
import Footer from "../components/Footer.tsx";
import {useEffect, useState} from "react";
import {User} from "@supabase/supabase-js";
import AuthWrapper from "../components/AuthWrapper.tsx";
import { UserProfileProvider } from "../contexts/UserProfileContext.tsx";


function Profile () {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    const ProfileContent = () => (
        <div className="min-h-screen bg-base-100 flex flex-col">
            <Navbar />
            <main className="flex-1">
                <ProfilePage />
            </main>
            <Footer />
        </div>
    );

    return user ? (
        <AuthWrapper user={user}>
            <UserProfileProvider user={user}>
                <ProfileContent />
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
                            Melde dich an, um dein Profil und deine Einstellungen zu verwalten.
                        </p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <a href="/login" className="btn btn-primary">Jetzt einloggen</a>
                            <a href="/signup" className="btn btn-ghost">Konto erstellen</a>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Profile;
