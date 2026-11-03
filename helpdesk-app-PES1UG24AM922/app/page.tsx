"use client";

import { useEffect, useRef, useState, FormEvent } from "react";

type HelpRequest = {
  id: number;
  student_name: string;
  message: string;
  created_at: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [source, setSource] = useState("");
  const [views, setViews] = useState<number | null>(null);
  const [error, setError] = useState("");
  const viewCounted = useRef(false);

  async function loadRequests() {
    const res = await fetch("/api/requests", { cache: "no-store" });
    const data = await res.json();
    setRequests(data.requests ?? []);
    setSource(data.source ?? "");
  }

  async function countView() {
    const res = await fetch("/api/views", { cache: "no-store" });
    const data = await res.json();
    setViews(data.views);
  }

  useEffect(() => {
    // guard against React strict-mode double effect in dev
    if (!viewCounted.current) {
      viewCounted.current = true;
      countView();
    }
    loadRequests();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_name: name, message }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error);
      return;
    }
    setName("");
    setMessage("");
    await loadRequests();
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Campus Help Desk Board</h1>
      <p><strong>Board views: {views ?? "N/A"}</strong></p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Student name"
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Help request"
          value={message}
          maxLength={200}
          rows={3}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Post Request</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <h2>Latest Requests</h2>
      <p>
        Source:{" "}
        <strong style={{ color: source === "Redis" ? "crimson" : "royalblue" }}>
          {source || "..."}
        </strong>
      </p>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {requests.map((r) => (
          <li key={r.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8 }}>
            <strong>{r.student_name}</strong>
            <div>{r.message}</div>
            <small>{new Date(r.created_at).toLocaleString()}</small>
          </li>
        ))}
        {requests.length === 0 && <li>No requests yet.</li>}
      </ul>
    </main>
  );
}
