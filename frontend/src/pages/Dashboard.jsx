import { Home, LogOut, Plus, RefreshCw, Zap, Trash2, Sliders } from "lucide-react";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import RoomCard from "../components/RoomCard.jsx";

export default function Dashboard({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [rules, setRules] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [deviceForm, setDeviceForm] = useState({ room_id: "", name: "", type: "Light" });
  const [ruleForm, setRuleForm] = useState({
    name: "",
    trigger_device_id: "",
    condition_type: ">",
    threshold_value: "",
    action_device_id: "",
    action_state: true
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [latestReadings, setLatestReadings] = useState({});
  const [ruleTriggeredAlert, setRuleTriggeredAlert] = useState(null);

  // Group devices by room id
  const groupedDevices = React.useMemo(() => {
    return devices.reduce((groups, device) => {
      groups[device.room_id] = groups[device.room_id] || [];
      groups[device.room_id].push(device);
      return groups;
    }, {});
  }, [devices]);

  // Unified reload function
  async function reloadDashboardData(showSpinner = false) {
    setError("");
    if (showSpinner) setLoading(true);
    try {
      const [roomData, deviceData] = await Promise.all([
        apiRequest("/rooms"),
        apiRequest("/devices")
      ]);
      setRooms(roomData);
      setDevices(deviceData);
      setDeviceForm((current) => ({
        ...current,
        room_id: current.room_id || roomData[0]?.id || ""
      }));
      setRuleForm((current) => ({
        ...current,
        trigger_device_id: current.trigger_device_id || deviceData[0]?.id || "",
        action_device_id: current.action_device_id || deviceData[0]?.id || ""
      }));

      // Fetch rules in a separate try-catch block so a failure doesn't block room/device rendering
      try {
        const ruleData = await apiRequest("/rules");
        setRules(ruleData);
      } catch (ruleErr) {
        console.error("Failed to load automation rules:", ruleErr);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  // Initial load and WebSocket sync
  useEffect(() => {
    reloadDashboardData(true);

    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("WebSocket Connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Live Update:", data);
        if (data.event === "device_updated") {
          // Sync device state update silently
          reloadDashboardData(false);
        } else if (data.event === "sensor_reading") {
          setLatestReadings((prev) => ({
            ...prev,
            [data.device_id]: {
              value: data.value,
              type: data.type,
              timestamp: data.timestamp
            }
          }));
        } else if (data.event === "rule_triggered") {
          // Set a floating visual toast alert when a rule executes
          setRuleTriggeredAlert(data);
          // Sync data to fetch the updated device statuses
          reloadDashboardData(false);
          // Auto-hide after 6 seconds
          setTimeout(() => {
            setRuleTriggeredAlert((current) => (current && current.rule_name === data.rule_name ? null : current));
          }, 6000);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    return () => {
      ws.close();
    };
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
      reloadDashboardData(false);
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
        body: JSON.stringify({
          ...deviceForm,
          room_id: Number(deviceForm.room_id),
          name: deviceForm.name.trim()
        }),
      });
      setDeviceForm({ ...deviceForm, name: "", type: "Light" });
      reloadDashboardData(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addRule(event) {
    event.preventDefault();
    if (!ruleForm.name.trim() || !ruleForm.trigger_device_id || !ruleForm.action_device_id || ruleForm.threshold_value === "") return;

    try {
      await apiRequest("/rules", {
        method: "POST",
        body: JSON.stringify({
          name: ruleForm.name.trim(),
          trigger_device_id: Number(ruleForm.trigger_device_id),
          condition_type: ruleForm.condition_type,
          threshold_value: Number(ruleForm.threshold_value),
          action_device_id: Number(ruleForm.action_device_id),
          action_state: ruleForm.action_state === "true" || ruleForm.action_state === true
        }),
      });
      setRuleForm((current) => ({
        ...current,
        name: "",
        threshold_value: ""
      }));
      reloadDashboardData(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRoom(roomId) {
    if (!window.confirm("Are you sure you want to delete this room? This will delete all devices inside it.")) return;
    try {
      await apiRequest(`/rooms/${roomId}`, { method: "DELETE" });
      reloadDashboardData(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteDevice(deviceId) {
    if (!window.confirm("Are you sure you want to delete this device?")) return;
    try {
      await apiRequest(`/devices/${deviceId}`, { method: "DELETE" });
      reloadDashboardData(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRule(ruleId) {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;
    try {
      await apiRequest(`/rules/${ruleId}`, { method: "DELETE" });
      reloadDashboardData(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleDevice(deviceId) {
    // Optimistic UI state update to avoid lag
    setDevices((current) =>
      current.map((device) => (device.id === deviceId ? { ...device, is_on: !device.is_on } : device))
    );

    try {
      await apiRequest(`/devices/${deviceId}/toggle`, { method: "PATCH" });
    } catch (err) {
      setError(err.message);
      reloadDashboardData(false); // Rollback to actual server state on error
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* 1. Rule Trigger Alert Notification Banner */}
      {ruleTriggeredAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-xl border border-emerald-250 bg-emerald-50 p-4 shadow-lg transition-all duration-300">
          <div className="flex gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
              <Zap className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">Automation Rule Executed</p>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">"{ruleTriggeredAlert.rule_name}"</h4>
              <p className="text-xs text-slate-600 mt-1">
                Sensor <span className="font-bold">"{ruleTriggeredAlert.trigger_device_name}"</span> read <span className="font-bold">{ruleTriggeredAlert.reading_value}</span> {ruleTriggeredAlert.condition_type === ">" ? "greater than" : "less than"} {ruleTriggeredAlert.threshold_value}.
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Automatically turned <span className="font-bold text-emerald-600">{ruleTriggeredAlert.action_state ? "ON" : "OFF"}</span> target device <span className="font-bold">"{ruleTriggeredAlert.action_device_name}"</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Top Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-600/10">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Home Device Manager</h1>
              <p className="text-xs text-slate-550 font-medium">Signed in as {user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => reloadDashboardData(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition shadow-sm cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white hover:bg-slate-800 active:bg-slate-950 transition shadow-sm cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Two Column Grid Layout */}
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[320px_1fr]">
        
        {/* Left Side: Control panel widgets */}
        <aside className="space-y-5">
          
          {/* Add Room Widget */}
          <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3" onSubmit={addRoom}>
            <h2 className="text-sm font-bold text-slate-900">Add Room</h2>
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition"
              placeholder="e.g. Living Room, Bedroom"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
            />
            <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition shadow-sm cursor-pointer">
              <Plus className="h-4 w-4" />
              Add Room
            </button>
          </form>

          {/* Add Device Widget */}
          <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3" onSubmit={addDevice}>
            <h2 className="text-sm font-bold text-slate-900">Add Device</h2>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
              value={deviceForm.room_id}
              onChange={(event) => setDeviceForm({ ...deviceForm, room_id: event.target.value })}
            >
              <option value="" disabled>Select Room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition"
              placeholder="e.g. Main Light, Ceiling Fan"
              value={deviceForm.name}
              onChange={(event) => setDeviceForm({ ...deviceForm, name: event.target.value })}
            />
            
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
              value={deviceForm.type}
              onChange={(event) => setDeviceForm({ ...deviceForm, type: event.target.value })}
            >
              {["Light", "Fan", "AC", "TV", "Heater", "Other"].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            
            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition shadow-sm disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              disabled={!rooms.length}
            >
              <Plus className="h-4 w-4" />
              Add Device
            </button>
          </form>

          {/* Add Automation Rule Widget */}
          <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3" onSubmit={addRule}>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              Add Automation Rule
            </h2>
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition"
              placeholder="Rule name, e.g., Auto Cool Room"
              required
              value={ruleForm.name}
              onChange={(event) => setRuleForm({ ...ruleForm, name: event.target.value })}
            />

            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
              value={ruleForm.trigger_device_id}
              onChange={(event) => setRuleForm({ ...ruleForm, trigger_device_id: event.target.value })}
            >
              <option value="" disabled>Select Trigger Device (Sensor)</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.type})
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                className="h-10 w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
                value={ruleForm.condition_type}
                onChange={(event) => setRuleForm({ ...ruleForm, condition_type: event.target.value })}
              >
                <option value=">">&gt; (More)</option>
                <option value="<">&lt; (Less)</option>
              </select>

              <input
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition"
                type="number"
                step="0.1"
                placeholder="Limit value (e.g. 23)"
                required
                value={ruleForm.threshold_value}
                onChange={(event) => setRuleForm({ ...ruleForm, threshold_value: event.target.value })}
              />
            </div>

            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
              value={ruleForm.action_device_id}
              onChange={(event) => setRuleForm({ ...ruleForm, action_device_id: event.target.value })}
            >
              <option value="" disabled>Select Target Device (Action)</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.type})
                </option>
              ))}
            </select>

            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
              value={ruleForm.action_state}
              onChange={(event) => setRuleForm({ ...ruleForm, action_state: event.target.value })}
            >
              <option value="true">Turn ON</option>
              <option value="false">Turn OFF</option>
            </select>

            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 active:bg-slate-950 transition shadow-sm disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              disabled={devices.length < 2}
            >
              <Plus className="h-4 w-4" />
              Create Rule
            </button>
          </form>

        </aside>

        {/* Right Side: Rooms Grid & Rules List */}
        <section className="space-y-6">
          
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Dynamic Rooms grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Rooms & Connected Devices</h3>
            {loading ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm">
                <RefreshCw className="h-7 w-7 animate-spin text-slate-400" />
                <p className="mt-3 text-xs font-medium">Loading dashboard...</p>
              </div>
            ) : rooms.length ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    devices={groupedDevices[room.id] || []}
                    latestReadings={latestReadings}
                    onDeleteRoom={deleteRoom}
                    onDeleteDevice={deleteDevice}
                    onToggleDevice={toggleDevice}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <h2 className="text-base font-bold text-slate-900">No rooms configured</h2>
                <p className="mt-1.5 text-xs text-slate-550 max-w-sm mx-auto">
                  Add a physical room from the left sidebar to start placing devices.
                </p>
              </div>
            )}
          </div>

          {/* Active Rules List Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Automation Rules</h3>
            
            {rules.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {rules.map((rule) => {
                  const triggerName = rule.trigger_device ? rule.trigger_device.name : `Device #${rule.trigger_device_id}`;
                  const actionName = rule.action_device ? rule.action_device.name : `Device #${rule.action_device_id}`;
                  const thresholdUnit = rule.trigger_device && (rule.trigger_device.type === "AC" || rule.trigger_device.type === "Heater") ? "°C" : "W";
                  
                  return (
                    <div key={rule.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{rule.name}</h4>
                        <p className="mt-1 text-xs text-slate-600 font-medium">
                          IF <span className="font-bold text-indigo-600">"{triggerName}"</span> {rule.condition_type} {rule.threshold_value}{thresholdUnit}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          THEN turn <span className={`font-bold ${rule.action_state ? "text-emerald-600" : "text-rose-600"}`}>{rule.action_state ? "ON" : "OFF"}</span> <span className="font-bold text-slate-800">"{actionName}"</span>
                        </p>
                      </div>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition shrink-0 cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 font-medium">
                No active automation rules. Define one using the panel on the left.
              </div>
            )}
          </div>

        </section>

      </div>
    </div>
  );
}
