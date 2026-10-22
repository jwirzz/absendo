import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_REASONS = new Set(["feature", "bug", "hilfe", "sonstiges"]);
const ALLOWED_ORIGINS = new Set([
    "https://absendo.app",
    "https://www.absendo.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]);

type FeedbackBody = {
    name?: unknown;
    email?: unknown;
    grund?: unknown;
    nachricht?: unknown;
};

function corsHeaders(request: Request): HeadersInit {
    const origin = request.headers.get("origin") ?? "";
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://absendo.app",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
    };
}

function json(request: Request, status: number, body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders(request), "Content-Type": "application/json" },
    });
}

function cleanText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string): boolean {
    return value.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sha256(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders(request) });
    }
    if (request.method !== "POST") {
        return json(request, 405, { error: "Method not allowed" });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 5_000) {
        return json(request, 413, { error: "Request too large" });
    }

    let body: FeedbackBody;
    try {
        body = await request.json();
    } catch {
        return json(request, 400, { error: "Invalid JSON" });
    }

    const name = cleanText(body.name);
    const email = cleanText(body.email).toLowerCase();
    const grund = cleanText(body.grund);
    const nachricht = cleanText(body.nachricht);

    if (
        name.length < 1 || name.length > 80 ||
        !isValidEmail(email) ||
        !ALLOWED_REASONS.has(grund) ||
        nachricht.length < 10 || nachricht.length > 1200
    ) {
        return json(request, 400, { error: "Invalid form data" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Missing Supabase server environment variables");
        return json(request, 500, { error: "Server configuration error" });
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientIp = request.headers.get("cf-connecting-ip") ?? forwardedFor ?? "unknown";
    const rateLimitSecret = Deno.env.get("FEEDBACK_RATE_LIMIT_SECRET") ?? serviceRoleKey;
    const fingerprint = await sha256(`${rateLimitSecret}:${clientIp}`);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: allowed, error: rateLimitError } = await supabase
        .rpc("consume_feedback_rate_limit", { p_fingerprint: fingerprint });

    if (rateLimitError) {
        console.error("Feedback rate-limit check failed", rateLimitError);
        return json(request, 500, { error: "Could not submit feedback" });
    }
    if (!allowed) {
        return json(request, 429, { error: "Too many requests" });
    }

    const { error: insertError } = await supabase
        .from("feedback")
        .insert({ name, email, grund, nachricht });

    if (insertError) {
        console.error("Feedback insert failed", insertError);
        return json(request, 500, { error: "Could not submit feedback" });
    }

    return json(request, 201, { ok: true });
});
