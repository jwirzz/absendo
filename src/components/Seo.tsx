import { Head } from "vite-react-ssg";
import { useLocation } from "react-router-dom";
import { resolveMeta, SITE_NAME, SITE_URL } from "../seo/routeMeta";

/**
 * Rendert alle SEO-relevanten <head>-Tags deklarativ. Über vite-react-ssg landen
 * Title, Description, Canonical, Robots, Open-Graph und JSON-LD bereits im
 * vorgerenderten HTML (Build-Zeit) und nicht erst nach der JS-Ausführung.
 */
export default function Seo() {
    const { pathname } = useLocation();
    const meta = resolveMeta(pathname);

    const canonical = new URL(meta.canonicalPath, SITE_URL).toString();
    const ogImage = new URL(meta.ogImage, SITE_URL).toString();

    return (
        <Head>
            <title>{meta.title}</title>
            <meta name="description" content={meta.description} />
            <meta name="robots" content={meta.robots} />
            <link rel="canonical" href={canonical} />

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={meta.title} />
            <meta property="og:description" content={meta.description} />
            <meta property="og:url" content={canonical} />
            <meta property="og:image" content={ogImage} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={meta.title} />
            <meta name="twitter:description" content={meta.description} />
            <meta name="twitter:image" content={ogImage} />

            {meta.jsonLd && (
                <script type="application/ld+json">{JSON.stringify(meta.jsonLd)}</script>
            )}
        </Head>
    );
}
