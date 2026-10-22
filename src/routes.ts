import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("pages/Home.tsx"),
    route("login", "pages/Login.tsx"),
    route("signup", "pages/Signup.tsx"),
    route("welcome", "pages/Onboarding.tsx"),
    route("email-verification", "pages/EmailVerification.tsx"),
    route("dashboard", "pages/Dashboard.tsx"),
    route("contact", "pages/Contact.tsx"),
    route("profile", "pages/Profile.tsx"),
    route("absences", "pages/AllAbsences.tsx"),
    route("datenschutz", "pages/DatenschutzPage.tsx"),
    route("bbzw-absenzformular", "pages/BbzwAbsenzformular.tsx"),
    route("bbzw-absenzen-entschuldigen", "pages/BbzwAbsenzenEntschuldigen.tsx"),
    route("support", "pages/Support.tsx"),
    route("demo", "pages/Demo.tsx"),
    route("*", "pages/NotFound.tsx"),
] satisfies RouteConfig;
