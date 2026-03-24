import {
  AudioLines,
  Camera,
  ChevronRight,
  Mic,
  MicOff,
  Settings,
  Shield,
  Square,
  UserRoundSearch,
} from "lucide-react";

export default function CandidateInterviewPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] px-6 py-7 text-slate-900">
      <div className="mx-auto max-w-[1220px] rounded-[30px] border border-[#dbe5ff] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <header className="flex items-center justify-between gap-6 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserRoundSearch className="h-6 w-6" />
            </div>
            <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-slate-950">
              Candidate Interview
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-600">
              <AudioLines className="h-4 w-4" />
              45:00
            </div>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-slate-50"
            >
              End Interview
            </button>
          </div>
        </header>

        <div className="space-y-6 bg-[#fbfcff] px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <TopStatusCard
              icon={<Mic className="h-5 w-5" />}
              eyebrow="MIC LEVEL"
              title="Active"
              accent="bg-blue-50 text-blue-600"
              detail={
                <div className="flex items-end gap-1">
                  <span className="h-3 w-1 rounded-full bg-blue-300" />
                  <span className="h-5 w-1 rounded-full bg-blue-500" />
                  <span className="h-4 w-1 rounded-full bg-blue-400" />
                </div>
              }
            />
            <TopStatusCard
              icon={<Shield className="h-5 w-5" />}
              eyebrow="LIVE PROCTORING"
              title="Secure"
              accent="bg-blue-50 text-blue-600"
            />
          </div>

          <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="relative mx-5 mt-5 overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#dde4ed_28%,_#96918a_45%,_#e6e0d7_60%,_#212121_100%)] px-10 pb-2 pt-8">
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                REC 00:12:45
              </div>

              <div className="mx-auto max-w-[760px] rounded-[26px] border-[14px] border-black bg-[#101418] p-4 shadow-[0_30px_50px_rgba(0,0,0,0.35)]">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_50%_20%,_#f2f5f7_0%,_#d4dde2_45%,_#bcc9d0_100%)]">
                  <div className="absolute bottom-0 left-0 right-0 h-[34%] bg-[linear-gradient(180deg,rgba(215,219,224,0)_0%,rgba(189,189,187,0.35)_20%,#d8d3ce_20%,#d8d3ce_100%)]" />
                  <div className="absolute bottom-[12%] left-[8%] h-[30%] w-[14%] rounded-t-full bg-[#2f6d43]" />
                  <div className="absolute bottom-[12%] left-[9%] h-[23%] w-[10%] rounded-full bg-[#345f35]" />
                  <div className="absolute bottom-[14%] right-[12%] h-[16%] w-[24%] rounded-t-[70px] bg-[#cbc7c2]" />
                  <div className="absolute left-1/2 top-[22%] h-[18%] w-[11%] -translate-x-1/2 rounded-full bg-[#f2d3bf]" />
                  <div className="absolute left-1/2 top-[18%] h-[9%] w-[12%] -translate-x-1/2 rounded-t-full bg-[#8d654f]" />
                  <div className="absolute left-1/2 top-[30%] h-[33%] w-[21%] -translate-x-1/2 rounded-t-[110px] bg-white" />
                  <div className="absolute left-[36%] top-[39%] h-[28%] w-[10%] -rotate-[10deg] rounded-[40px] bg-[#f4dbc9]" />
                  <div className="absolute right-[36%] top-[39%] h-[28%] w-[10%] rotate-[10deg] rounded-[40px] bg-[#f4dbc9]" />
                  <div className="absolute bottom-[10%] left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-red-600 shadow-[0_0_0_6px_rgba(255,255,255,0.35)]" />
                </div>
              </div>

              <div className="mx-auto h-10 w-20 rounded-b-[10px] bg-black shadow-[0_8px_0_rgba(0,0,0,0.25)]" />
            </div>

            <div className="mx-5 my-5 rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                    Question 3 of 10
                  </div>
                  <h2 className="mt-5 max-w-[900px] text-[2rem] font-bold leading-[1.18] tracking-[-0.04em] text-slate-950">
                    Can you describe a time you handled a difficult situation with a coworker? How
                    did you approach the resolution?
                  </h2>
                </div>
                <p className="pt-1 text-sm font-medium text-slate-400">Remaining: 01:45</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-5 border-t border-slate-100 bg-white px-6 py-5">
              <button
                type="button"
                className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-slate-50 px-6 py-4 text-base font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                <Square className="h-4 w-4" />
                Skip
              </button>
              <button
                type="button"
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.28)] transition hover:bg-blue-700"
              >
                Next Question
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </section>
        </div>

        <footer className="border-t border-slate-100 bg-white px-6 py-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-3 text-blue-500">
              <div className="flex items-end gap-1">
                <span className="h-3 w-1 rounded-full bg-blue-300" />
                <span className="h-6 w-1 rounded-full bg-blue-500" />
                <span className="h-4 w-1 rounded-full bg-blue-400" />
                <span className="h-8 w-1 rounded-full bg-blue-600" />
              </div>
              <p className="text-lg font-medium italic text-slate-500">
                Listening for your response...
              </p>
            </div>

            <div className="flex items-center gap-8">
              <FooterControl
                icon={<MicOff className="h-5 w-5" />}
                label="MUTE"
                active={false}
              />
              <FooterControl
                icon={<Camera className="h-6 w-6" />}
                label="CAMERA ON"
                active
              />
              <FooterControl
                icon={<Settings className="h-5 w-5" />}
                label="SETTINGS"
                active={false}
              />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function TopStatusCard({
  accent,
  detail,
  eyebrow,
  icon,
  title,
}: {
  accent: string;
  detail?: React.ReactNode;
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          <p className="mt-1 text-[1.7rem] font-bold leading-none tracking-[-0.04em] text-slate-950">
            {title}
          </p>
        </div>
      </div>
      {detail ? <div className="text-blue-500">{detail}</div> : null}
    </div>
  );
}

function FooterControl({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button type="button" className="flex flex-col items-center gap-2">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          active
            ? "bg-blue-600 text-white shadow-[0_12px_26px_rgba(37,99,235,0.28)]"
            : "bg-slate-50 text-slate-500"
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-xs font-semibold tracking-[0.08em] ${
          active ? "text-blue-600" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
