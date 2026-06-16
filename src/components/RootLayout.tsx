import { Outlet } from "react-router-dom";
import Seo from "./Seo.tsx";
import UmamiPageTracker from "./UmamiPageTracker.tsx";

export default function RootLayout() {
    return (
        <>
            <Seo />
            <UmamiPageTracker />
            <Outlet />
        </>
    );
}
