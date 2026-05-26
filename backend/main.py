import os
import asyncio
import random
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
from auth import create_access_token, get_current_user, hash_password, verify_password
from database import Base, engine, get_db, SessionLocal
from models import Device, Room, User, SensorReading, AutomationRule
from schemas import DeviceCreate, DeviceOut, RoomCreate, RoomOut, Token, UserCreate, UserLogin, SensorReadingOut, AutomationRuleCreate, AutomationRuleOut


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Home Device Manager API")

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self,websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_json(message)
manager= ConnectionManager()


async def sensor_simulation_loop():
    while True:
        await asyncio.sleep(8)
        db = SessionLocal()
        try:
            active_devices = db.query(Device).filter(Device.is_on == True).all()
            readings_added = []
            for device in active_devices:
                val = 0.0
                r_type = ""
                
                # Check device type to logically generate data
                if device.type == "AC":
                    val = round(random.uniform(18.0, 24.0), 1)  # temp in Celsius
                    r_type = "temperature"
                elif device.type == "Heater":
                    val = round(random.uniform(25.0, 32.0), 1)  # temp in Celsius
                    r_type = "temperature"
                elif device.type == "Light":
                    val = round(random.uniform(5.0, 15.0), 1)  # power in Watts
                    r_type = "power"
                elif device.type == "Fan":
                    val = round(random.uniform(40.0, 70.0), 1)  # power in Watts
                    r_type = "power"
                elif device.type == "TV":
                    val = round(random.uniform(80.0, 150.0), 1)  # power in Watts
                    r_type = "power"
                else:
                    val = round(random.uniform(10.0, 100.0), 1)  # default power load
                    r_type = "power"

                reading = SensorReading(device_id=device.id, value=val, type=r_type)
                db.add(reading)
                readings_added.append(reading)
            
            if readings_added:
                db.commit()
                # Broadcast the live readings to all active websockets
                for r in readings_added:
                    await manager.broadcast({
                        "event": "sensor_reading",
                        "device_id": r.device_id,
                        "value": r.value,
                        "type": r.type,
                        "timestamp": r.timestamp.isoformat() if r.timestamp else datetime.now().isoformat()
                    })

                    # Evaluate Automation Rules
                    rules = db.query(AutomationRule).filter(
                        AutomationRule.trigger_device_id == r.device_id,
                        AutomationRule.is_active == True
                    ).all()

                    for rule in rules:
                        triggered = False
                        if rule.condition_type == ">" and r.value > rule.threshold_value:
                            triggered = True
                        elif rule.condition_type == "<" and r.value < rule.threshold_value:
                            triggered = True

                        if triggered:
                            action_device = db.query(Device).filter(Device.id == rule.action_device_id).first()
                            if action_device and action_device.is_on != rule.action_state:
                                # Fetch the name of the triggering device
                                trigger_dev = db.query(Device).filter(Device.id == r.device_id).first()
                                trigger_name = trigger_dev.name if trigger_dev else "Sensor"

                                print(f"\n[RULES ENGINE] Triggered Rule: '{rule.name}'")
                                print(f"  - Condition: '{trigger_name}' ({r.value}) {rule.condition_type} {rule.threshold_value}")
                                print(f"  - Action: Turn {'ON' if rule.action_state else 'OFF'} '{action_device.name}'")

                                # Apply the rule action
                                action_device.is_on = rule.action_state
                                db.commit()

                                # Broadcast updated device state to update toggle UI
                                await manager.broadcast({
                                    "event": "device_updated",
                                    "device_id": action_device.id,
                                    "is_on": action_device.is_on
                                })

                                # Broadcast automation rule trigger alert
                                await manager.broadcast({
                                    "event": "rule_triggered",
                                    "rule_name": rule.name,
                                    "trigger_device_name": trigger_name,
                                    "reading_value": r.value,
                                    "condition_type": rule.condition_type,
                                    "threshold_value": rule.threshold_value,
                                    "action_device_name": action_device.name,
                                    "action_state": action_device.is_on
                                })
        except Exception as e:
            print(f"Error in sensor simulation loop: {e}")
        finally:
            db.close()


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(sensor_simulation_loop())

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"access_token": create_access_token(str(user.id)), "user": user}


@app.post("/auth/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"access_token": create_access_token(str(user.id)), "user": user}


@app.get("/rooms", response_model=list[RoomOut])
def get_rooms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Room).filter(Room.user_id == current_user.id).order_by(Room.created_at.desc()).all()


@app.post("/rooms", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = Room(name=payload.name, user_id=current_user.id)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@app.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id, Room.user_id == current_user.id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    db.delete(room)
    db.commit()
    return None


@app.get("/devices", response_model=list[DeviceOut])
def get_devices(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Device).filter(Device.user_id == current_user.id).order_by(Device.created_at.desc()).all()


@app.post("/devices", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: DeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == payload.room_id, Room.user_id == current_user.id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    device = Device(
        room_id=payload.room_id,
        user_id=current_user.id,
        name=payload.name,
        type=payload.type,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@app.patch("/devices/{device_id}/toggle", response_model=DeviceOut)
async def toggle_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.user_id == current_user.id
    ).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.is_on = not device.is_on

    db.commit()
    db.refresh(device)

    await manager.broadcast({
        "event": "device_updated",
        "device_id": device.id,
        "is_on": device.is_on
    })

    return device


@app.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    db.delete(device)
    db.commit()
    return None


@app.get("/devices/{device_id}/history", response_model=list[SensorReadingOut])
def get_device_history(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return db.query(SensorReading).filter(SensorReading.device_id == device_id).order_by(SensorReading.timestamp.desc()).limit(15).all()


@app.get("/rules", response_model=list[AutomationRuleOut])
def get_rules(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(AutomationRule).filter(AutomationRule.user_id == current_user.id).all()


@app.post("/rules", response_model=AutomationRuleOut, status_code=status.HTTP_201_CREATED)
def create_rule(
    payload: AutomationRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify trigger device exists and belongs to current user
    trig = db.query(Device).filter(Device.id == payload.trigger_device_id, Device.user_id == current_user.id).first()
    if not trig:
        raise HTTPException(status_code=404, detail="Trigger device not found")

    # Verify action device exists and belongs to current user
    act = db.query(Device).filter(Device.id == payload.action_device_id, Device.user_id == current_user.id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Action device not found")

    rule = AutomationRule(
        user_id=current_user.id,
        name=payload.name,
        trigger_device_id=payload.trigger_device_id,
        condition_type=payload.condition_type,
        threshold_value=payload.threshold_value,
        action_device_id=payload.action_device_id,
        action_state=payload.action_state
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@app.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id, AutomationRule.user_id == current_user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return None
