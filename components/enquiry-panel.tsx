"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserRound,
  Phone,
  Clock3,
  Heart,
  MousePointerClick,
} from "lucide-react";
export default function EnquiryPanel({
  rows,
}: {
  rows: Array<Record<string, any>>;
}) {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const [remote, setRemote] = useState<Array<Record<string, any>> | null>(null),
    [nextOffset, setNextOffset] = useState<number | null>(
      rows.length === 200 ? 200 : null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setRemote(null);
    setNextOffset(rows.length === 200 ? 200 : null);
  }, [rows]);
  useEffect(() => {
    if (!query.trim()) {
      setRemote(null);
      setNextOffset(rows.length === 200 ? 200 : null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true);
      setError("");
      fetch("/api/admin/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, offset: 0 }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw Error("Search unavailable");
          return res.json() as Promise<{
            rows: Array<Record<string, any>>;
            nextOffset: number | null;
          }>;
        })
        .then((data) => {
          setRemote(data.rows);
          setNextOffset(data.nextOffset);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, rows]);
  async function older() {
    if (nextOffset === null) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, offset: nextOffset }),
      });
      if (!res.ok) throw Error("Could not load older records");
      const data = (await res.json()) as {
        rows: Array<Record<string, any>>;
        nextOffset: number | null;
      };
      setRemote((v) => [...(v || rows), ...data.rows]);
      setNextOffset(data.nextOffset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim(),
      digits = q.replace(/\D/g, "");
    return (remote || rows).filter(
      (r) =>
        !q ||
        [r.name, r.first_name, r.last_name, r.phone, r.reference].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q),
        ) ||
        (digits.length >= 3 &&
          String(r.phone || "")
            .replace(/\D/g, "")
            .includes(digits)),
    );
  }, [rows, query, remote]);
  const active = filtered.find((r) => r.reference === selected) || filtered[0];
  return (
    <div className="enquiry-browser">
      <label className="enquiry-search">
        <Search />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone or enquiry reference"
          aria-label="Search saved enquiries"
        />
        <span>{filtered.length}</span>
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="enquiry-columns">
        <div className="enquiry-list">
          {filtered.map((r) => (
            <button
              key={r.reference}
              onClick={() => setSelected(r.reference)}
              className={active?.reference === r.reference ? "selected" : ""}
            >
              <span className="enquiry-avatar">
                {String(r.first_name || r.name || "?").slice(0, 1)}
              </span>
              <span>
                <b>{r.name || [r.first_name, r.last_name].join(" ")}</b>
                <small>{r.phone || "Phone not supplied"}</small>
                <small>{r.reference}</small>
              </span>
              <time>
                {new Date(Number(r.created_at) * 1000).toLocaleDateString(
                  "en-IN",
                )}
              </time>
            </button>
          ))}
          {!filtered.length && (
            <p>{busy ? "Searching…" : "No matching enquiries."}</p>
          )}
          {nextOffset !== null && (
            <button disabled={busy} onClick={older}>
              {busy
                ? "Loading…"
                : query
                  ? "Search older history"
                  : "Load older enquiries"}
            </button>
          )}
        </div>
        {active ? (
          <article className="enquiry-detail">
            <span className="kicker">ENQUIRY DETAILS</span>
            <h3>
              {active.name || [active.first_name, active.last_name].join(" ")}
            </h3>
            <p>{active.reference}</p>
            <dl>
              {[
                [<Phone key="p" />, "Phone", active.phone || "Not supplied"],
                [
                  <UserRound key="u" />,
                  "Age & gender",
                  `${active.age} · ${active.gender}`,
                ],
                [<Heart key="h" />, "Treatment", active.service],
                [
                  <Heart key="t" />,
                  "Therapist preference",
                  active.therapist_preference || "Help me choose",
                ],
                [
                  <MousePointerClick key="m" />,
                  "Selected button",
                  active.button_id,
                ],
                [
                  <Clock3 key="c" />,
                  "Received",
                  new Date(Number(active.created_at) * 1000).toLocaleString(
                    "en-IN",
                    { timeZone: "Asia/Kolkata" },
                  ),
                ],
              ].map(([icon, label, value]) => (
                <div key={String(label)}>
                  <dt>
                    {icon}
                    <span>{label}</span>
                  </dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
            <small>
              Private enquiry · only authorised administrators can view these
              details.
            </small>
          </article>
        ) : (
          <article className="enquiry-detail">
            <UserRound />
            <h3>Enquiries will appear here.</h3>
            <p>
              Search by name or phone and review treatment preferences in one
              place.
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
