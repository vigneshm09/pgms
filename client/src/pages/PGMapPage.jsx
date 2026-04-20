import { useEffect, useMemo, useState } from "react";

import api from "../api";

function PGMapPage() {
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMap = async () => {
      try {
        const response = await api.get("/pg-map");
        setFloors(response.data);

        if (response.data.length > 0) {
          setSelectedFloorId(response.data[0].id);
          setSelectedRoomId(response.data[0].rooms[0]?.id || "");
        }
      } catch (requestError) {
        setError(requestError.response?.data?.detail || "Unable to load PG map.");
      }
    };

    loadMap();
  }, []);

  const selectedFloor = useMemo(
    () => floors.find((floor) => floor.id === selectedFloorId) || floors[0],
    [floors, selectedFloorId]
  );

  const selectedRoom = useMemo(
    () => selectedFloor?.rooms.find((room) => room.id === selectedRoomId) || selectedFloor?.rooms[0],
    [selectedFloor, selectedRoomId]
  );

  const filteredBeds = useMemo(() => {
    if (!selectedRoom) {
      return [];
    }

    if (bedFilter === "all") {
      return selectedRoom.beds;
    }

    const expectedStatus = bedFilter === "available" ? "Available" : "Occupied";
    return selectedRoom.beds.filter((bed) => bed.status === expectedStatus);
  }, [bedFilter, selectedRoom]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900">PG Map</h2>
        <p className="text-sm text-slate-500">Open a floor, select a room, and inspect available or occupied beds.</p>
      </div>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <section className="card">
        <div className="flex flex-wrap gap-3">
          {floors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              onClick={() => {
                setSelectedFloorId(floor.id);
                setSelectedRoomId(floor.rooms[0]?.id || "");
              }}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                (selectedFloor?.id || "") === floor.id
                  ? "bg-brand-500 text-white"
                  : "bg-blue-50 text-brand-700 hover:bg-blue-100"
              }`}
            >
              {floor.name} ({floor.room_count} rooms)
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{selectedFloor?.name || "No Floor"}</h3>
              <p className="text-sm text-slate-500">{selectedFloor?.available_beds || 0} beds available</p>
            </div>
            <div className="rounded-2xl bg-blue-100 px-4 py-3 text-2xl">🏢</div>
          </div>

          {selectedFloor?.rooms?.length ? (
            <div className="grid gap-3">
              {selectedFloor.rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`rounded-3xl border p-4 text-left transition ${
                    (selectedRoom?.id || "") === room.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-blue-100 bg-slate-50 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
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
                      {room.available_beds > 0 ? `${room.available_beds} free` : "Full"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-blue-200 p-6 text-center text-sm text-slate-500">
              No rooms added on this floor yet.
            </div>
          )}
        </div>

        <div className="card space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {selectedRoom ? `Room ${selectedRoom.room_number}` : "Select a room"}
              </h3>
              <p className="text-sm text-slate-500">
                {selectedRoom ? `${selectedRoom.available_beds} beds free out of ${selectedRoom.capacity}` : "Choose a room card from the left."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Beds" },
                { id: "available", label: "Available Beds" },
                { id: "occupied", label: "Occupied Beds" }
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setBedFilter(filter.id)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    bedFilter === filter.id
                      ? "bg-brand-500 text-white"
                      : "bg-blue-50 text-brand-700 hover:bg-blue-100"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {selectedRoom ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBeds.map((bed) => (
                <div
                  key={bed.bed_number}
                  className={`rounded-3xl border p-4 ${
                    bed.status === "Available" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <p className="text-base font-bold text-slate-900">{bed.bed_number}</p>
                  <p
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      bed.status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {bed.status}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    {bed.tenant_name ? `Occupied by ${bed.tenant_name}` : "Ready for assignment"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-blue-200 p-8 text-center text-sm text-slate-500">
              Add floors and rooms first to see the PG map.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PGMapPage;

