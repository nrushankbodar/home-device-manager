import { Home, LogOut, Plus, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../api.js";
import RoomCard from "../components/RoomCard.jsx";

export default function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [deviceForm, setDeviceForm] = useState({ room_id: "", name: "", type: "Light" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const groupedDevices = useMemo(() => {
    return devices.reduce((groups, device) => {
      groups[device.room_id] = groups[device.room_id] || [];
      groups[device.room_id].push(device);
      return groups;
    }, {});
  }, [devices]);

  async function loadDashboard() {
    setError("");
    setLoading(true);
    try {
      const [roomData, deviceData] = await Promise.all([apiRequest("/rooms"), apiRequest("/devices")]);
      setRooms(roomData);
      setDevices(deviceData);
      setDeviceForm((current) => ({ ...current, room_id: current.room_id || roomData[0]?.id || "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function addRoom(event) {
    event.preventDefault();
    if (!roomName.trim()) return;

    try {
      await apiRequest("/rooms", {
        method: "POST",
        body: JSON.stringify({ name: roomName.trim() }),
      });
      setRoomName("");
      loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addDevice(event) {
    event.preventDefault();
    if (!deviceForm.room_id || !deviceForm.name.trim()) return;

    try {
      await apiRequest("/devices", {
        method: "POST",
        body: JSON.stringify({ ...deviceForm, room_id: Number(deviceForm.room_id), name: deviceForm.name.trim() }),
      });
      setDeviceForm({ ...deviceForm, name: "", type: "Light" });
      loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRoom(roomId) {
    await apiRequest(`/rooms/${roomId}`, { method: "DELETE" });
    loadDashboard();
  }

  async function deleteDevice(deviceId) {
    await apiRequest(`/devices/${deviceId}`, { method: "DELETE" });
    loadDashboard();
  }

  async function toggleDevice(deviceId) {
    const updated = await apiRequest(`/devices/${deviceId}/toggle`, { method: "PATCH" });
    setDevices((current) => current.map((device) => (device.id === updated.id ? updated : device)));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-600 text-white">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">Home Device Manager</h1>
              <p className="text-sm text-slate-500">Signed in as {user.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              onClick={loadDashboard}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={addRoom}>
            <h2 className="text-base font-bold text-slate-950">Add Room</h2>
            <input
              className="mt-3 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-500"
              placeholder="Bedroom, Hall, Kitchen"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
            />
            <button className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
              Add Room
            </button>
          </form>

          <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={addDevice}>
            <h2 className="text-base font-bold text-slate-950">Add Device</h2>
            <select
              className="mt-3 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-500"
              value={deviceForm.room_id}
              onChange={(event) => setDeviceForm({ ...deviceForm, room_id: event.target.value })}
            >
              <option value="">Select room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            <input
              className="mt-3 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-500"
              placeholder="Main light, Ceiling fan"
              value={deviceForm.name}
              onChange={(event) => setDeviceForm({ ...deviceForm, name: event.target.value })}
            />
            <select
              className="mt-3 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-500"
              value={deviceForm.type}
              onChange={(event) => setDeviceForm({ ...deviceForm, type: event.target.value })}
            >
              {["Light", "Fan", "AC", "TV", "Heater", "Other"].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <button
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!rooms.length}
            >
              <Plus className="h-4 w-4" />
              Add Device
            </button>
          </form>
        </aside>

        <section>
          {error && <p className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading dashboard...
            </div>
          ) : rooms.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  devices={groupedDevices[room.id] || []}
                  onDeleteRoom={deleteRoom}
                  onDeleteDevice={deleteDevice}
                  onToggleDevice={toggleDevice}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">No rooms yet</h2>
              <p className="mt-2 text-slate-500">Add your first room, then connect devices to it.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
