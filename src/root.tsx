import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts } from "react-router";
import Seo from "./components/Seo.tsx";
import UmamiPageTracker from "./components/UmamiPageTracker.tsx";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";

export default function App() {
    return (
        <>
            <Seo />
            <UmamiPageTracker />
            <Outlet />
        </>
    );
}

export function Layout({ children }: { children: ReactNode }) {
    return (
        <html data-theme="absendo" lang="de">
            <head>
                <meta charSet="UTF-8" />
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta name="theme-color" content="#0f172a" />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    );
}
