export function getGermanAuthError(error: unknown, fallback: string): string {
    if (!(error instanceof Error) || !error.message) {
        return fallback;
    }

    const message = error.message.toLowerCase();

    if (message.includes("invalid login credentials")) {
        return "E-Mail oder Passwort ist falsch.";
    }
    if (message.includes("email not confirmed")) {
        return "Bitte bestätige zuerst deine E-Mail-Adresse.";
    }
    if (message.includes("user already registered")) {
        return "Diese E-Mail ist bereits registriert. Bitte logge dich ein.";
    }
    if (message.includes("password should be at least")) {
        return "Das Passwort ist zu kurz.";
    }
    if (message.includes("unable to validate email address")) {
        return "Die E-Mail-Adresse ist ungültig.";
    }
    if (message.includes("signup is disabled")) {
        return "Die Registrierung ist aktuell deaktiviert.";
    }
    if (message.includes("too many requests")) {
        return "Zu viele Versuche. Bitte warte kurz und versuche es erneut.";
    }

    return fallback;
}
