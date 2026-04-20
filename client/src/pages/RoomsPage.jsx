import { useEffect, useState } from "react";

import api from "../api";

const initialFloorForm = {
  name: "",
  order: ""
};

const initialRoomForm = {
  floor_id: "",
  room_number: "",
  capacity: ""
};

function RoomsPage() {
  const [floorForm, setFloorForm] = useState(initialFloorForm);
  const [roomForm, setRoomForm] = useState(initialRoomForm);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bedInputs, setBedInputs] = useState({});
  const [error, setError] = useState("");
  const [floorSaving, setFloorSaving] = useState(false);
  const [roomSaving, setRoomSaving] = useState(false);

  const loadData = async () => {
    try {
      const [floorsResponse, roomsResponse] = await Promise.all([api.get("/floors"), api.get("/rooms")]);
      setFloors(floorsResponse.data);
      setRooms(roomsResponse.data);

      if (!roomForm.floor_id && floorsResponse.data.length > 0) {
        setRoomForm((current) => ({
          ...current,
          floor_id: floorsResponse.data[0].id
        }));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load room data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFloorSubmit = async (event) => {
    event.preventDefault();
    setFloorSaving(true);
    setError("");

    try {
      await api.post("/floors", {
        name: floorForm.name,
        order: Number(floorForm.order)
      });
      setFloorForm(initialFloorForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to add floor.");
    } finally {
      setFloorSaving(false);
    }
  };

  const handleRoomSubmit = async (event) => {
    event.preventDefault();
    setRoomSaving(true);
    setError("");

    try {
      await api.post("/rooms", {
        floor_id: roomForm.floor_id,
        room_number: roomForm.room_number,
        capacity: Number(roomForm.capacity)
      });
      setRoomForm((current) => ({
        ...current,
        room_number: "",
        capacity: ""
      }));
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to add room.");
    } finally {
      setRoomSaving(false);
    }
  };

  const handleAddBeds = async (roomId) => {
    const count = Number(bedInputs[roomId] || 0);
    if (!count) {
      return;
    }

    try {
      setError("");
      await api.post(`/rooms/${roomId}/beds`, { count });
      setBedInputs((current) => ({ ...current, [roomId]: "" }));
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to add beds.");
    }
  };

  const groupedFloors = floors.map((floor) => ({
    ...floor,
    rooms: rooms.filter((room) => room.floor_id === floor.id)
  }));
  const unassignedRooms = rooms.filter((room) => !room.floor_id);
  const floorSections = unassignedRooms.length
    ? [
        ...groupedFloors,
        {
          id: "unassigned-floor",
          name: "Unassigned Floor",
          order: "-",
          rooms: unassignedRooms
        }
      ]
    : groupedFloors;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900">Rooms, Floors, and Beds</h2>
        <p className="text-sm text-slate-500">Add floors, create rooms inside them, and increase bed count whenever needed.</p>
      </div>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleFloorSubmit} className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-100 px-4 py-3 text-2xl">🏢</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add Floor</h3>
              <p className="text-sm text-slate-500">Example: Ground Floor, First Floor, Second Floor.</p>
            </div>
          </div>

          <input
            className="input-field"
            placeholder="Floor name"
            value={floorForm.name}
            onChange={(event) => setFloorForm({ ...floorForm, name: event.target.value })}
          />
          <input
            className="input-field"
            type="number"
            min="0"
            placeholder="Display order"
            value={floorForm.order}
            onChange={(event) => setFloorForm({ ...floorForm, order: event.target.value })}
          />

          <button type="submit" className="primary-button w-full text-base" disabled={floorSaving}>
            <span>{floorSaving ? "..." : "+"}</span>
            <span>{floorSaving ? "Saving floor" : "Save Floor"}</span>
          </button>
        </form>

        <form onSubmit={handleRoomSubmit} className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-100 px-4 py-3 text-2xl">🛏️</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add Room</h3>
              <p className="text-sm text-slate-500">Choose the floor and starting number of beds.</p>
            </div>
          </div>

          <select
            className="input-field"
            value={roomForm.floor_id}
            onChange={(event) => setRoomForm({ ...roomForm, floor_id: event.target.value })}
          >
            <option value="">Select floor</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>
          <input
            className="input-field"
            placeholder="Room number"
            value={roomForm.room_number}
            onChange={(event) => setRoomForm({ ...roomForm, room_number: event.target.value })}
          />
          <input
            className="input-field"
            type="number"
            min="1"
            placeholder="Initial beds"
            value={roomForm.capacity}
            onChange={(event) => setRoomForm({ ...roomForm, capacity: event.target.value })}
          />

          <button
            type="submit"
            className="primary-button w-full text-base"
            disabled={roomSaving || floors.length === 0 || !roomForm.floor_id}
          >
            <span>{roomSaving ? "..." : "+"}</span>
            <span>{roomSaving ? "Saving room" : "Save Room"}</span>
          </button>

          {floors.length === 0 ? (
            <p className="text-sm text-amber-700">Add a floor first before creating rooms.</p>
          ) : null}
        </form>
      </section>

      <section className="space-y-5">
        {floorSections.length === 0 ? (
          <div className="card text-center text-sm text-slate-500">No floors added yet.</div>
        ) : (
          floorSections.map((floor) => (
            <div key={floor.id} className="card space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{floor.name}</h3>
                  <p className="text-sm text-slate-500">{floor.rooms.length} rooms on this floor</p>
                </div>
                <div className="rounded-2xl bg-blue-100 px-4 py-3 text-sm font-semibold text-brand-700">
                  Order {floor.order}
                </div>
              </div>

              {floor.rooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-blue-200 p-6 text-center text-sm text-slate-500">
                  No rooms added on this floor yet.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {floor.rooms.map((room) => {
                    const percentFilled = room.capacity ? (room.occupants / room.capacity) * 100 : 0;
                    return (
                      <div key={room.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-bold text-slate-900">Room {room.room_number}</p>
                            <p className="text-sm text-slate-500">
                              {room.occupants}/{room.capacity} occupied
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              room.available_beds > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {room.available_beds > 0 ? `${room.available_beds} beds free` : "Full"}
                          </span>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-100">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${percentFilled}%` }} />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {room.beds.map((bed) => (
                            <span
                              key={bed.bed_number}
                              className={`rounded-full px-3 py-2 text-xs font-semibold ${
                                bed.status === "Available"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {bed.bed_number}
                            </span>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <input
                            className="input-field"
                            type="number"
                            min="1"
                            placeholder="Extra beds"
                            value={bedInputs[room.id] || ""}
                            onChange={(event) =>
                              setBedInputs((current) => ({ ...current, [room.id]: event.target.value }))
                            }
                          />
                          <button type="button" onClick={() => handleAddBeds(room.id)} className="secondary-button">
                            <span>+</span>
                            <span>Add Beds</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default RoomsPage;
