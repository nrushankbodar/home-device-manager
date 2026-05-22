import { Trash2 } from "lucide-react";
import React from "react";

import DeviceCard from "./DeviceCard.jsx";

export default function RoomCard({ room, devices, onDeleteRoom, onDeleteDevice, onToggleDevice }) {
  const activeDevices = devices.filter((device) => device.is_on).length;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{room.name}</h2>
          <p className="text-sm text-slate-500">
            {devices.length} devices · {activeDevices} on
          </p>
        </div>
        <button
          className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          title="Delete room"
          onClick={() => onDeleteRoom(room.id)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {devices.length ? (
          devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onDelete={() => onDeleteDevice(device.id)}
              onToggle={() => onToggleDevice(device.id)}
            />
          ))
        ) : (
          <p className="rounded-md bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No devices in this room.</p>
        )}
      </div>
    </article>
  );
}
