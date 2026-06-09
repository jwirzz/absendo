import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import RouteSeo from "./components/RouteSeo.tsx";
import UmamiPageTracker from "./components/UmamiPageTracker.tsx";

const Home = lazy(() => import("./pages/Home.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Signup = lazy(() => import("./pages/Signup.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const EmailVerification = lazy(() => import("./pages/EmailVerification.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const AllAbsences = lazy(() => import("./pages/AllAbsences.tsx"));
const DatenschutzPage = lazy(() => import("./pages/DatenschutzPage.tsx"));
const BbzwAbsenzformular = lazy(() => import("./pages/BbzwAbsenzformular.tsx"));
const Support = lazy(() => import("./pages/Support.tsx"));

const Loading = () => <div className="flex justify-center items-center h-screen">Lade...</div>;

function AppRoutes() {
    return (
        <Router>
            <RouteSeo />
            <UmamiPageTracker />
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Navigate to="/" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/welcome" element={<Onboarding />} />
                    <Route path="/email-verification" element={<EmailVerification />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/absences" element={<AllAbsences />} />
                    <Route path="/datenschutz" element={<DatenschutzPage />} />
                    <Route path="/bbzw-absenzformular" element={<BbzwAbsenzformular />} />
                    <Route path="/support" element={<Support />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default AppRoutes;
