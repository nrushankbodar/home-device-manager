import { Trash2 } from "lucide-react";
import React from "react";
import DeviceCard from "./DeviceCard.jsx";

export default function RoomCard({ room, devices, latestReadings = {}, onDeleteRoom, onDeleteDevice, onToggleDevice }) {
  const activeDevices = devices.filter((device) => device.is_on).length;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{room.name}</h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {devices.length} {devices.length === 1 ? "device" : "devices"} · {activeDevices} active
          </p>
        </div>
        
        <button
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition cursor-pointer"
          title="Delete Room"
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete room "${room.name}"? This will delete all devices in it.`)) {
              onDeleteRoom(room.id);
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {devices.length ? (
          devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              latestReading={latestReadings[device.id] || null}
              onDelete={() => onDeleteDevice(device.id)}
              onToggle={() => onToggleDevice(device.id)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-400 font-medium">
            No devices configured in this room.
          </div>
        )}
      </div>
    </article>
  );
}
