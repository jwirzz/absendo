import Navbar from "../components/Navbar.tsx";
import {supabase } from "../supabaseClient.ts";
import {useEffect, useState} from "react";
import {User} from "@supabase/supabase-js";
import AllAbsencesComponent from "../components/AllAbsencesComponent.tsx";
import AuthWrapper from "../components/AuthWrapper.tsx";


function AllAbsences () {
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

    const AllAbsencesContent = () => (
        <div className="min-h-screen bg-base-200/40">
            <Navbar />
            <AllAbsencesComponent />
        </div>
    );

    return user ? (
        <AuthWrapper user={user}>
            <AllAbsencesContent />
        </AuthWrapper>
    ) : (
        <div className="min-h-screen bg-base-200/40">
            <Navbar />
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <h1 className="text-2xl font-bold">Bitte melde dich an, um deine Absenzen zu sehen.</h1>
                <a href="/login" className="btn btn-primary mt-4">Zum Login</a>
            </div>
        </div>
    );
}

export default AllAbsences;