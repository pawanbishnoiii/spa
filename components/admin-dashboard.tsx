"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Camera,
  Clock3,
  Eye,
  ImageUp,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MousePointerClick,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import EnquiryPanel from "@/components/enquiry-panel";

type Data = {
  leads: Array<Record<string, any>>;
  settings: Record<string, string>;
  therapists: Array<Record<string, any>>;
  analytics: {
    totals: Record<string, number>;
    sources: Array<Record<string, any>>;
    days: Array<Record<string, any>>;
    events: Array<Record<string, any>>;
    sessions: Array<Record<string, any>>;
    buttons: Array<Record<string, any>>;
  };
};
const priceFields = [
  ["package_hour_1", "1 hour"],
  ["package_hour_2", "2 hours"],
  ["package_hour_3", "3 hours"],
  ["package_hour_4", "4 hours"],
  ["package_full_day", "Full day"],
  ["package_full_night", "Full night"],
  ["price_calm_30", "Quiet Flow · 30 min"],
  ["price_calm_60", "Quiet Flow · 60 min"],
  ["price_calm_90", "Quiet Flow · 90 min"],
  ["price_deep_60", "Deep Release · 60 min"],
  ["price_deep_90", "Deep Release · 90 min"],
  ["price_aroma_60", "Aroma Ritual · 60 min"],
  ["price_aroma_90", "Aroma Ritual · 90 min"],
];
const businessFields = [
  ["hero_image", "Hero image URL"],
  ["hero_title", "Hero heading"],
  ["hero_intro", "Hero description"],
  ["image_calm", "Quiet Flow image URL"],
  ["image_deep", "Deep Release image URL"],
  ["image_aroma", "Aroma image URL"],
  ["site_name", "Website name"],
  ["registration_fee", "Registration fee"],
  ["business_phone", "Phone"],
  ["telegram_username", "Telegram username or URL"],
  ["telegram_cta_en", "Telegram button label"],
  ["opening_hours", "Opening hours"],
  ["meta_pixel_id", "Meta Pixel ID"],
  ["adsense_client_id", "AdSense client ID"],
];

export default function AdminDashboard({
  email,
  signOutPath,
  storageReady,
}: {
  email: string;
  signOutPath: string;
  storageReady: boolean;
}) {
  const [tab, setTab] = useState("overview");
  const [loadError, setLoadError] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [therapists, setTherapists] = useState<Array<Record<string, any>>>([]);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    const res = await fetch("/api/admin/data", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load dashboard");
    const json = (await res.json()) as Data;
    setData(json);
    setSettings({
      collect_user_details: "on",
      site_name: "Quiet Ritual Spa",
      telegram_username: "SpaYakshini1",
      telegram_cta_en: "Chat on Telegram",
      registration_fee: "₹199",
      package_hour_1: "₹1,700",
      package_hour_2: "₹2,000",
      package_hour_3: "₹3,000",
      package_hour_4: "₹4,000",
      package_full_day: "₹5,000",
      package_full_night: "₹5,000",
      ...json.settings,
    });
    setTherapists(
      json.therapists.length
        ? json.therapists
        : [
            {
              id: "t1",
              name_en: "Therapist One",
              name_hi: "Therapist One",
              speciality_en: "Relaxation massage",
              speciality_hi: "Relaxation massage",
              active: 1,
              imageUrl: "/images/real-aroma.jpg",
            },
            {
              id: "t2",
              name_en: "Therapist Two",
              name_hi: "Therapist Two",
              speciality_en: "Deep-pressure techniques",
              speciality_hi: "Deep-pressure techniques",
              active: 1,
              imageUrl: "/images/real-deep.jpg",
            },
          ],
    );
  };
  useEffect(() => {
    load().catch((e) => {
      setLoadError(e.message);
      toast.error(e.message);
    });
  }, []);
  const events = useMemo(
    () =>
      Object.fromEntries(
        (data?.analytics.events ?? []).map((x) => [
          x.event_name,
          Number(x.count),
        ]),
      ),
    [data],
  );
  async function save() {
    setSaving(true);
    try {
      const body = {
        settings,
        therapists: therapists.map((t) => ({
          id: t.id,
          nameEn: t.name_en,
          nameHi: t.name_en,
          specialityEn: t.speciality_en,
          specialityHi: t.speciality_en,
          active: Boolean(t.active),
        })),
      };
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Changes published to site data");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }
  async function clearHistory(scope: string) {
    if (
      !window.confirm(
        `Delete ${scope} history permanently? This cannot be undone.`,
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/data", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      if (!res.ok) throw new Error("Deletion failed");
      await load();
      toast.success("History deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deletion failed");
    }
  }
  async function upload(id: string, file?: File, kind = "portrait") {
    if (!file) return;
    const form = new FormData();
    form.append("therapistId", id);
    form.append("kind", kind);
    form.append("file", file);
    toast.loading("Uploading portrait…", { id: "upload" });
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const json = (await res.json()) as {
      error?: string;
      id?: string;
      imageUrl?: string;
    };
    if (!res.ok) {
      toast.error(json.error ?? "Upload failed", { id: "upload" });
      return;
    }
    if (!json.imageUrl) {
      toast.error("Upload response was incomplete", { id: "upload" });
      return;
    }
    const imageUrl = json.imageUrl;
    if (kind === "hero") setSettings((v) => ({ ...v, hero_image: imageUrl }));
    else
      setTherapists((v) =>
        v.map((t) =>
          t.id === id
            ? kind === "gallery"
              ? {
                  ...t,
                  photos: [...(t.photos || []), { id: json.id, url: imageUrl }],
                }
              : { ...t, imageUrl }
            : t,
        ),
      );
    toast.success("Portrait updated", { id: "upload" });
  }
  async function removePhoto(therapistId: string, photoId: string) {
    if (!confirm("Permanently remove this gallery photo?")) return;
    const res = await fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ therapistId, photoId }),
    });
    if (!res.ok) {
      toast.error("Could not remove photo");
      return;
    }
    setTherapists((v) =>
      v.map((t) =>
        t.id === therapistId
          ? {
              ...t,
              photos: (t.photos || []).filter((p: any) => p.id !== photoId),
            }
          : t,
      ),
    );
    toast.success("Photo removed");
  }
  async function removeProfile(id: string, name: string) {
    if (
      !confirm(
        `Delete ${name} and every uploaded profile photo? This cannot be undone.`,
      )
    )
      return;
    const exists = therapists.some(
      (t) => t.id === id && data?.therapists.some((x) => x.id === id),
    );
    if (exists) {
      const res = await fetch("/api/admin/data", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope: "profile", id }),
      });
      if (!res.ok) {
        toast.error("Could not delete profile");
        return;
      }
    }
    setTherapists((v) => v.filter((t) => t.id !== id));
    toast.success("Profile deleted");
  }
  async function protectLegacy() {
    try {
      const res = await fetch("/api/admin/security", { method: "POST" });
      if (!res.ok) throw Error("Encryption unavailable");
      const json = (await res.json()) as { protected: number };
      toast.success(`${json.protected} legacy records protected`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to protect records");
    }
  }
  if (loadError)
    return (
      <main className="admin-loading">
        <h1>Dashboard could not load</h1>
        <p>{loadError}</p>
        <button
          onClick={() => {
            setLoadError("");
            load().catch((e) => setLoadError(e.message));
          }}
        >
          Try again
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="admin-loading">
        <Sparkles />
        <p>Preparing your spa command centre…</p>
      </main>
    );
  const totals = data.analytics.totals;
  return (
    <div className="admin-shell">
      <Toaster position="top-right" />
      <aside className="admin-rail">
        <div className="admin-logo">
          <Sparkles />
        </div>
        <nav>
          <a
            href="#overview"
            onClick={() => setTab("overview")}
            aria-label="Overview"
          >
            <LayoutDashboard />
          </a>
          <a
            href="#content"
            onClick={() => setTab("content")}
            aria-label="Content"
          >
            <Settings2 />
          </a>
          <a href="#team" onClick={() => setTab("team")} aria-label="Team">
            <Users />
          </a>
        </nav>
        {signOutPath.startsWith("/api/") ? (
          <form action={signOutPath} method="post">
            <button aria-label="Sign out">
              <LogOut />
            </button>
          </form>
        ) : (
          <a href={signOutPath} target="_top" aria-label="Sign out">
            <LogOut />
          </a>
        )}
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <span>SPA COMMAND CENTRE</span>
            <h1>Good to see you.</h1>
            <p>{email}</p>
          </div>
          <div>
            <Link href="/" target="_blank">
              View site <ArrowUpRight />
            </Link>
            <button onClick={save} disabled={saving}>
              <Save />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </header>
        <Tabs value={tab} onValueChange={setTab} className="admin-tabs">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Prices & ads</TabsTrigger>
            <TabsTrigger value="team">Team media</TabsTrigger>
            <TabsTrigger value="leads">Saved enquiries</TabsTrigger>
            <TabsTrigger value="visitors">Visitors & clicks</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" id="overview">
            <section className="metric-grid">
              <Metric
                icon={<Eye />}
                label="Unique visitors"
                value={totals.visitors ?? 0}
                accent="coral"
              />
              <Metric
                icon={<Activity />}
                label="Sessions"
                value={totals.sessions ?? 0}
              />
              <Metric
                icon={<Clock3 />}
                label="Avg. time"
                value={`${Math.round((totals.avg_duration ?? 0) / 60)}m`}
              />
              <Metric
                icon={<MousePointerClick />}
                label="Telegram clicks"
                value={events.telegram_click ?? 0}
                accent="yellow"
              />
            </section>
            <section className="admin-analytics-grid">
              <article className="chart-card wide">
                <div>
                  <span>VISITOR MOMENTUM</span>
                  <h2>Last 30 days</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.analytics.days}>
                    <defs>
                      <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0"
                          stopColor="#ff684d"
                          stopOpacity={0.7}
                        />
                        <stop offset="1" stopColor="#ff684d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#dfe6e2" />
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#ff684d"
                      fill="url(#visitors)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </article>
              <article className="chart-card">
                <div>
                  <span>ACQUISITION</span>
                  <h2>Traffic sources</h2>
                  <button
                    className="history-delete"
                    onClick={() => clearHistory("sources")}
                  >
                    Clear source history
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.analytics.sources} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="source"
                      width={90}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="sessions"
                      fill="#0b493f"
                      radius={[0, 9, 9, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </article>
              <article className="event-card">
                <span>CTA SIGNALS</span>
                <h2>Telegram conversion</h2>
                {[
                  ["Telegram clicks", events.telegram_click ?? 0],
                  ["Service views", events.service_view ?? 0],
                  ["Sessions", totals.sessions ?? 0],
                  ["Visitors", totals.visitors ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <b>{value}</b>
                    <span>{label}</span>
                  </div>
                ))}
              </article>
            </section>
          </TabsContent>
          <TabsContent value="content" id="content">
            <section className="admin-editor">
              <div className="editor-heading">
                <span>LIVE CONTENT</span>
                <h2>Brand, prices & campaign IDs</h2>
                <p>
                  Website name, Telegram action, prices and public details
                  update without rebuilding the site.
                </p>
              </div>
              <div className="hero-media-editor">
                <img
                  src={settings.hero_image || "/images/hero-bed.jpg"}
                  alt="Current hero photograph"
                />
                <div>
                  <h3>Hero photograph</h3>
                  <p>
                    Upload a wide, clear JPG, PNG or WebP image, up to 5 MB.
                    Changes publish immediately.
                  </p>
                  <label className="btn">
                    <ImageUp />
                    Replace hero image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={!storageReady}
                      onChange={(e) =>
                        upload("hero", e.target.files?.[0], "hero")
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="security-summary">
                <ShieldCheck />
                <div>
                  <b>Private enquiry vault</b>
                  <p>
                    New personal details use AES-GCM encryption. Admin access,
                    secure cookies and login rate limits protect the dashboard.
                  </p>
                  <button className="history-delete" onClick={protectLegacy}>
                    Encrypt older enquiry records
                  </button>
                </div>
              </div>
              <div className="active-row lead-toggle">
                <div>
                  <b>Collect user details</b>
                  <small>
                    On: short enquiry form. Off: open Telegram directly.
                  </small>
                </div>
                <Switch
                  checked={settings.collect_user_details !== "off"}
                  onCheckedChange={(checked) =>
                    setSettings((v) => ({
                      ...v,
                      collect_user_details: checked ? "on" : "off",
                    }))
                  }
                />
              </div>
              <div className="editor-grid">
                {priceFields.map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      value={settings[key] ?? ""}
                      onChange={(e) =>
                        setSettings((v) => ({ ...v, [key]: e.target.value }))
                      }
                      placeholder="₹ —"
                    />
                  </label>
                ))}
                {businessFields.map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      value={settings[key] ?? ""}
                      maxLength={
                        key.startsWith("telegram_cta_")
                          ? 40
                          : key === "site_name"
                            ? 80
                            : 500
                      }
                      onChange={(e) =>
                        setSettings((v) => ({ ...v, [key]: e.target.value }))
                      }
                      placeholder={
                        key.includes("pixel") || key.includes("adsense")
                          ? "Disabled until configured"
                          : "Enter value"
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="privacy-note">
                <Sparkles />
                <p>
                  Meta Pixel and AdSense load only after advertising consent.
                  Use a Google-certified CMP before personalized ads in the EEA,
                  UK or Switzerland. Keep imagery and service copy professional
                  because sexually suggestive content can restrict or disable ad
                  serving.
                </p>
              </div>
            </section>
          </TabsContent>
          <TabsContent value="team" id="team">
            <section className="team-editor">
              <div className="editor-heading">
                <span>PROFILE STUDIO</span>
                <h2>Manage every therapist profile</h2>
                <p>
                  Edit names and specialities, control visibility, replace the
                  cover image, and add up to eight gallery photos per profile.
                </p>
                <div className="profile-studio-stats">
                  <span>
                    <b>{therapists.length}</b> total profiles
                  </span>
                  <span>
                    <b>{therapists.filter((t) => t.active).length}</b> live on
                    site
                  </span>
                  <span>
                    <b>
                      {therapists.reduce(
                        (sum, t) => sum + (t.photos || []).length,
                        0,
                      )}
                    </b>{" "}
                    gallery photos
                  </span>
                </div>
                <button
                  className="btn"
                  disabled={therapists.length >= 6}
                  onClick={() =>
                    setTherapists((v) => [
                      ...v,
                      {
                        id: `t${[1, 2, 3, 4, 5, 6].find((n) => !v.some((t) => t.id === `t${n}`))}`,
                        name_en: "New therapist",
                        speciality_en: "Massage care",
                        active: 0,
                        imageUrl: "/images/portrait-1.jpg",
                      },
                    ])
                  }
                >
                  Add therapist profile
                </button>
              </div>
              {therapists.map((t, i) => (
                <article key={t.id}>
                  <div className="profile-admin-heading">
                    <div>
                      <strong>{t.name_en || "Untitled profile"}</strong>
                      <span>
                        Profile {i + 1} of {therapists.length} ·{" "}
                        {t.active ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <button
                      className="profile-delete"
                      onClick={() =>
                        removeProfile(t.id, t.name_en || "this profile")
                      }
                    >
                      Delete profile
                    </button>
                  </div>
                  <div className="team-photo">
                    <img
                      src={
                        t.imageUrl ??
                        (i === 0
                          ? "/images/real-aroma.jpg"
                          : "/images/real-deep.jpg")
                      }
                      alt="Therapist profile"
                    />
                    <label>
                      <ImageUp />
                      <span>Replace photo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => upload(t.id, e.target.files?.[0])}
                        disabled={!storageReady}
                      />
                    </label>
                  </div>
                  <div className="team-fields">
                    <label>
                      <span>Display name</span>
                      <input
                        value={t.name_en}
                        onChange={(e) =>
                          setTherapists((v) =>
                            v.map((x) =>
                              x.id === t.id
                                ? { ...x, name_en: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Speciality</span>
                      <input
                        value={t.speciality_en}
                        onChange={(e) =>
                          setTherapists((v) =>
                            v.map((x) =>
                              x.id === t.id
                                ? { ...x, speciality_en: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <div className="active-row">
                      <div>
                        <b>Visible on site</b>
                        <small>Hide without deleting the profile</small>
                      </div>
                      <Switch
                        checked={Boolean(t.active)}
                        onCheckedChange={(checked) =>
                          setTherapists((v) =>
                            v.map((x) =>
                              x.id === t.id
                                ? { ...x, active: checked ? 1 : 0 }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="profile-media-manager">
                      <b>Photo gallery · {(t.photos || []).length}/8</b>
                      <div>
                        {(t.photos || []).map((photo: any) => (
                          <figure key={photo.id}>
                            <img src={photo.url} alt="Profile gallery" />
                            <button
                              onClick={() => removePhoto(t.id, photo.id)}
                              aria-label="Remove gallery photo"
                            >
                              Remove
                            </button>
                          </figure>
                        ))}
                      </div>
                      <label className="gallery-upload">
                        <ImageUp />
                        Add gallery photos
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          disabled={
                            !storageReady || (t.photos || []).length >= 8
                          }
                          onChange={async (e) => {
                            const files = [...(e.target.files || [])].slice(
                              0,
                              8 - (t.photos || []).length,
                            );
                            for (const file of files)
                              await upload(t.id, file, "gallery");
                          }}
                        />
                      </label>
                      <small>
                        Upload photos of consenting adult team members only.
                      </small>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </TabsContent>
          <TabsContent value="leads">
            <section className="admin-editor">
              <h2>Saved enquiries</h2>
              <button
                className="history-delete"
                onClick={() => clearHistory("enquiries")}
              >
                Delete enquiry history
              </button>
              <p>Latest 200 enquiries · details are retained for 90 days.</p>
              <EnquiryPanel rows={data.leads} />
            </section>
          </TabsContent>
          <TabsContent value="visitors">
            <section className="admin-editor">
              <h2>Button performance</h2>
              <p>
                Click rate is the share of tracked sessions that clicked each
                button. Analytics includes visitors who allowed analytics.
              </p>
              <div className="button-metrics">
                {data.analytics.buttons.map((b) => (
                  <article key={b.button_id}>
                    <span>{b.button_id.replaceAll("_", " ")}</span>
                    <strong>{b.clicks} clicks</strong>
                    <small>
                      {b.users} sessions ·{" "}
                      {totals.sessions
                        ? Math.round((b.users / totals.sessions) * 100)
                        : 0}
                      % click rate
                    </small>
                  </article>
                ))}
              </div>
              <h2>Visitor sessions</h2>
              <button
                className="history-delete"
                onClick={() => clearHistory("analytics")}
              >
                Delete visitor & click history
              </button>
              <DataTable
                rows={data.analytics.sessions}
                fields={[
                  "visitor_hash",
                  "source",
                  "medium",
                  "campaign",
                  "device",
                  "landing_path",
                  "page_count",
                  "duration_seconds",
                  "first_seen",
                  "last_seen",
                ]}
              />
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <article className={`metric-card ${accent ?? ""}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function DataTable({
  rows,
  fields,
}: {
  rows: Array<Record<string, any>>;
  fields: string[];
}) {
  return (
    <div className="admin-table-wrap">
      <table>
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f}>{f.replaceAll("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.reference || row.id || i}>
              {fields.map((f) => (
                <td key={f}>
                  {f.endsWith("_at") || f.endsWith("_seen")
                    ? new Date(Number(row[f]) * 1000).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })
                    : f === "visitor_hash"
                      ? String(row[f]).slice(0, 12)
                      : String(row[f] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p>No records yet. New activity will appear here.</p>}
    </div>
  );
}
