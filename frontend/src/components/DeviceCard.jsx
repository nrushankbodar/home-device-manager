import { Fan, Lightbulb, Monitor, Snowflake, Trash2, Zap } from "lucide-react";
import React, { useState, useEffect } from "react";
import { apiRequest } from "../api.js";

const icons = {
  AC: Snowflake,
  Fan,
  Light: Lightbulb,
  TV: Monitor,
};

export default function DeviceCard({ device, latestReading, onDelete, onToggle }) {
  const Icon = icons[device.type] || Zap;
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history when card is expanded
  useEffect(() => {
    if (!expanded) return;
    let active = true;
    
    async function fetchHistory() {
      try {
        const data = await apiRequest(`/devices/${device.id}/history`);
        if (active) setHistory(data);
      } catch (err) {
        console.error("Failed to fetch device history:", err);
      }
    }
    
    fetchHistory();
    return () => {
      active = false;
    };
  }, [expanded, device.id]);

  // Real-time append new sensor readings
  useEffect(() => {
    if (latestReading && expanded && device.is_on) {
      setHistory((prev) => {
        // Prevent duplicate entries based on timestamp
        const exists = prev.some((r) => r.timestamp === latestReading.timestamp);
        if (exists) return prev;
        return [latestReading, ...prev].slice(0, 15);
      });
    }
  }, [latestReading, expanded, device.is_on]);

  // Simple active accent colors
  const theme = React.useMemo(() => {
    if (!device.is_on) {
      return {
        iconBg: "bg-white text-slate-400 border border-slate-200",
        toggleBg: "bg-slate-200",
        thumbBg: "bg-white",
      };
    }

    switch (device.type) {
      case "Light":
        return {
          iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
          toggleBg: "bg-emerald-600",
          thumbBg: "bg-white",
        };
      case "Fan":
        return {
          iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
          toggleBg: "bg-emerald-600",
          thumbBg: "bg-white",
        };
      case "AC":
        return {
          iconBg: "bg-sky-50 text-sky-600 border border-sky-100",
          toggleBg: "bg-emerald-600",
          thumbBg: "bg-white",
        };
      case "TV":
        return {
          iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-100",
          toggleBg: "bg-emerald-600",
          thumbBg: "bg-white",
        };
      default:
        return {
          iconBg: "bg-slate-100 text-slate-600 border border-slate-200",
          toggleBg: "bg-emerald-600",
          thumbBg: "bg-white",
        };
    }
  }, [device.is_on, device.type]);

  const unit = device.type === "AC" || device.type === "Heater" ? "°C" : "W";

  return (
    <div 
      onClick={(e) => {
        // Prevent expansion when clicking buttons
        if (e.target.closest("button")) return;
        setExpanded(!expanded);
      }}
      className="flex flex-col gap-1 rounded-xl border border-slate-150 bg-slate-50/50 p-3 hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      
      {/* Main Row */}
      <div className="flex items-center justify-between gap-3">
        
        {/* Device Info */}
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-all duration-200 ${theme.iconBg}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className={`truncate font-semibold text-sm transition-colors duration-200 ${device.is_on ? "text-slate-900" : "text-slate-500"}`}>
              {device.name}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{device.type}</p>
          </div>
        </div>

        {/* Live reading & Switch */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Live reading indicator */}
          {device.is_on && latestReading && (
            <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm animate-pulse-slow">
              {latestReading.value} {unit}
            </span>
          )}

          {/* Toggle Switch */}
          <button
            className={`h-6 w-11 rounded-full p-0.5 transition-all duration-200 relative cursor-pointer ${theme.toggleBg}`}
            title="Toggle Power"
            onClick={onToggle}
          >
            <span
              className={`block h-5 w-5 rounded-full shadow-sm transition-all duration-200 ${theme.thumbBg} ${
                device.is_on ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>

          {/* Delete Device */}
          <button
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition cursor-pointer"
            title="Delete Device"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Expanded Telemetry History list */}
      {expanded && (
        <div className="mt-3 border-t border-slate-200/60 pt-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">TELEMETRY DIAGNOSTICS</p>
          {history.length ? (
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {history.map((h, index) => {
                const timeStr = new Date(h.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                });
                return (
                  <div 
                    key={h.id || index} 
                    className="flex items-center justify-between text-xs text-slate-600 bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-200/60 font-medium"
                  >
                    <span className="font-bold text-slate-700">{h.value} {unit}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{timeStr}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-3 text-center">
              {device.is_on 
                ? "Waiting for incoming telemetry stream..." 
                : "Telemetry offline. Turn device ON to start collecting data."}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
