import { Home, LockKeyhole, Mail, ShieldCheck, Wifi } from "lucide-react";
import React, { useState } from "react";

import { apiRequest } from "../api.js";

export default function Login({ onAuth, onSwitch }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-6 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_420px]">
        <div className="hidden bg-emerald-700 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-md bg-white/15">
              <Home className="h-6 w-6" />
            </div>
            <h1 className="mt-6 text-4xl font-bold">Home Device Manager</h1>
            <p className="mt-4 max-w-sm text-base leading-7 text-emerald-50">
              Control rooms, devices, and live power states from one simple dashboard.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-md bg-white/10 p-4">
              <Wifi className="h-5 w-5" />
              <span className="font-medium">Room-wise device control</span>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-white/10 p-4">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-medium">JWT protected account access</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-emerald-100 text-emerald-700 lg:hidden">
                <Home className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-emerald-700">Home Device Manager</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">Login to manage your smart home dashboard.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    className="h-11 w-full outline-none"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    className="h-11 w-full outline-none"
                    type="password"
                    required
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                </div>
              </label>

              {error && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

              <button
                className="h-11 w-full rounded-md bg-emerald-700 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <button className="mt-5 w-full rounded-md border border-slate-200 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50" onClick={onSwitch}>
              Create an account
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
