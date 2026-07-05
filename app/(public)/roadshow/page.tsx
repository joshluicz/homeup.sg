import { RoadshowHero } from "@/components/sections/RoadshowHero";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Roadshow Display | HomeUP",
  description:
    "A non-indexed HomeUP roadshow display page for showing fixed-fee property agent proof points and video on desktop screens.",
  path: "/roadshow",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
});

const ROADSHOW_VIDEO_SRC = "/videos/homeup-roadshow.mp4";
const OFFLINE_ZIP_SRC = "/downloads/homeup-roadshow-offline.zip";

interface RoadshowPageProps {
  searchParams?: {
    setup?: string | string[];
  };
}

function isSetupMode(value: string | string[] | undefined) {
  const setup = Array.isArray(value) ? value[0] : value;
  return setup === "1" || setup === "true";
}

function RoadshowSetup() {
  return (
    <main className="min-h-screen bg-[#f3fff8] px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#00a65a]/20 bg-white p-8 shadow-[0_24px_80px_rgba(0,105,58,0.14)]">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#008f52]">
          HomeUP Roadshow
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
          Offline display kit
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-neutral-600">
          Download this ZIP before the event. After it is downloaded, the roadshow display can run
          without internet access.
        </p>

        <a
          href={OFFLINE_ZIP_SRC}
          download="homeup-roadshow-offline.zip"
          className="mt-7 inline-flex rounded-2xl bg-neutral-950 px-6 py-3 text-base font-bold text-white shadow-lg transition-colors hover:bg-neutral-800"
        >
          Download offline kit
        </a>

        <div className="mt-8 rounded-2xl bg-neutral-950 p-6 text-white">
          <h2 className="font-display text-2xl font-extrabold">How to run it</h2>
          <ol className="mt-4 space-y-3 text-base leading-relaxed text-neutral-200">
            <li>1. Unzip the downloaded file.</li>
            <li>
              2. Double-click{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5">index.html</code> inside the
              unzipped folder.
            </li>
            <li>3. Chrome or Edge should open the roadshow display.</li>
            <li>4. Plug the laptop into the TV screen.</li>
            <li>
              5. Press <code className="rounded bg-white/10 px-1.5 py-0.5">F11</code> for full
              screen.
            </li>
            <li>6. If the video does not autoplay with sound, click the video once.</li>
          </ol>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <h3 className="font-bold">Windows security</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Open <code>index.html</code> only. Do not run any script files. If Smart App Control
              blocks something, close that dialog and open <code>index.html</code> from the
              unzipped folder instead.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <h3 className="font-bold">Online option</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              If internet is available, open <code>/roadshow</code> in the browser instead. This
              setup page is at <code>/roadshow?setup=1</code>.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RoadshowPage({ searchParams }: RoadshowPageProps) {
  if (isSetupMode(searchParams?.setup)) {
    return <RoadshowSetup />;
  }

  return <RoadshowHero videoSrc={ROADSHOW_VIDEO_SRC} />;
}
