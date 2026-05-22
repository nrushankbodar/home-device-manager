import { Fan, Lightbulb, Monitor, Snowflake, Trash2, Zap } from "lucide-react";
import React from "react";

const icons = {
  AC: Snowflake,
  Fan,
  Light: Lightbulb,
  TV: Monitor,
};

export default function DeviceCard({ device, onDelete, onToggle }) {
  const Icon = icons[device.type] || Zap;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${device.is_on ? "bg-amber-100 text-amber-700" : "bg-white text-slate-500"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{device.name}</p>
          <p className="text-sm text-slate-500">{device.type}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          className={`h-8 w-14 rounded-full p-1 transition ${device.is_on ? "bg-emerald-600" : "bg-slate-300"}`}
          title="Toggle device"
          onClick={onToggle}
        >
          <span
            className={`block h-6 w-6 rounded-full bg-white transition ${device.is_on ? "translate-x-6" : "translate-x-0"}`}
          />
        </button>
        <button
          className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          title="Delete device"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
