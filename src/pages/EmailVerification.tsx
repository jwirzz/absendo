export default function EmailVerificationCard() {

    return (
        <div className="flex min-h-screen items-center justify-center bg-base-200/40 px-4 py-10">
            <div className="card w-full max-w-md bg-base-100 p-8 text-center shadow-soft-lg ring-1 ring-base-300/70">
                <a href="/" className="mb-7 inline-flex items-center justify-center gap-2">
                    <img src="/logo.png" alt="Absendo Logo" className="h-7 w-7" />
                    <span className="text-lg font-bold tracking-tight">Absendo</span>
                </a>

                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-3xl">
                    ✉️
                </div>

                <h1 className="display-md mb-2">Schau in dein Postfach!</h1>
                <p className="text-base-content/70">
                    Ich habe dir einen Bestätigungslink per E-Mail geschickt. Klick darauf, um dein
                    Konto zu aktivieren und loszulegen. 🚀
                </p>

                <div className="mt-7 flex flex-col gap-3">
                    <a href="/login" className="btn btn-primary w-full gap-1.5">
                        In dein Konto einloggen
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                    <a href="/home" className="btn btn-ghost w-full">
                        Zurück zur Startseite
                    </a>
                </div>

                <p className="mt-6 text-sm text-base-content/55">
                    Keine E-Mail erhalten? Schau im Spam-Ordner nach oder{" "}
                    <a href="/contact" className="link link-primary">kontaktiere mich</a>.
                </p>
            </div>
        </div>
    );
}
