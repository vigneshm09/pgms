import { useEffect, useMemo, useState } from "react";

import api, { buildApiAssetUrl } from "../api";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  profession: "",
  join_date: "",
  emergency_contact: "",
  id_proof_number: "",
  room_id: "",
  bed_number: "",
  rent: ""
};

function TenantsPage() {
  const [formData, setFormData] = useState(initialForm);
  const [idProofFile, setIdProofFile] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editFormData, setEditFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      const [tenantsResponse, roomsResponse] = await Promise.all([api.get("/tenants"), api.get("/rooms")]);
      setTenants(tenantsResponse.data);
      setRooms(roomsResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load tenants.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === formData.room_id) || null,
    [rooms, formData.room_id]
  );

  const availableBeds = useMemo(() => {
    if (!selectedRoom) {
      return [];
    }

    return selectedRoom.beds.filter((bed) => bed.status === "Available");
  }, [selectedRoom]);

  const filteredTenants = useMemo(() => {
    const lowered = searchTerm.toLowerCase();
    return tenants.filter((tenant) => {
      const target = `${tenant.name} ${tenant.email || ""} ${tenant.phone} ${tenant.address} ${tenant.room_number || ""} ${tenant.bed_number || ""} ${tenant.profession}`.toLowerCase();
      return target.includes(lowered);
    });
  }, [searchTerm, tenants]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      if (idProofFile) {
        payload.append("id_proof", idProofFile);
      }

      await api.post("/tenants", payload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setFormData(initialForm);
      setIdProofFile(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to add tenant.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tenantId) => {
    try {
      setError("");
      await api.delete(`/tenants/${tenantId}`);
      if (selectedTenant?.id === tenantId) {
        setSelectedTenant(null);
      }
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to delete tenant.");
    }
  };

  const handleEditClick = (tenant) => {
    setEditingTenant(tenant);
    setEditFormData({
      name: tenant.name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      address: tenant.address || "",
      profession: tenant.profession || "",
      join_date: tenant.join_date || "",
      emergency_contact: tenant.emergency_contact || "",
      id_proof_number: tenant.id_proof_number || "",
      room_id: tenant.room_id || "",
      bed_number: tenant.bed_number || "",
      rent: tenant.rent?.toString() || ""
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {};
      Object.entries(editFormData).forEach(([key, value]) => {
        if (key !== "email" && key !== "password" && value !== "") {
          payload[key] = key === "rent" ? parseFloat(value) || 0 : value;
        }
      });

      await api.put(`/tenants/${editingTenant.id}`, payload);
      setEditingTenant(null);
      setEditFormData(initialForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to update tenant.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
      ...(key === "room_id" ? { bed_number: "" } : {})
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900">Tenants</h2>
        <p className="text-sm text-slate-500">Manage the full tenant register, including ID proofs, room assignment, and bed selection.</p>
      </div>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 px-4 py-3 text-2xl">🧑</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add Tenant</h3>
              <p className="text-sm text-slate-500">Capture full details once, then access them anytime.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input-field"
              placeholder="Tenant name"
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
            <input
              className="input-field"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
            <input
              className="input-field"
              type="password"
              placeholder="Temporary password"
              value={formData.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
            <input
              className="input-field"
              placeholder="Mobile number"
              value={formData.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
            <input
              className="input-field"
              placeholder="Profession"
              value={formData.profession}
              onChange={(event) => updateField("profession", event.target.value)}
            />
            <input
              className="input-field"
              type="date"
              value={formData.join_date}
              onChange={(event) => updateField("join_date", event.target.value)}
            />
            <input
              className="input-field"
              placeholder="Emergency contact"
              value={formData.emergency_contact}
              onChange={(event) => updateField("emergency_contact", event.target.value)}
            />
            <input
              className="input-field"
              placeholder="ID proof number"
              value={formData.id_proof_number}
              onChange={(event) => updateField("id_proof_number", event.target.value)}
            />
            <input
              className="input-field"
              type="number"
              min="1"
              placeholder="Monthly rent"
              value={formData.rent}
              onChange={(event) => updateField("rent", event.target.value)}
            />
          </div>

          <textarea
            className="input-field min-h-28 resize-none"
            placeholder="Address"
            value={formData.address}
            onChange={(event) => updateField("address", event.target.value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <select
              className="input-field"
              value={formData.room_id}
              onChange={(event) => updateField("room_id", event.target.value)}
            >
              <option value="">Assign room later</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.floor_name} - Room {room.room_number} ({room.available_beds} beds free)
                </option>
              ))}
            </select>

            <select
              className="input-field"
              value={formData.bed_number}
              onChange={(event) => updateField("bed_number", event.target.value)}
              disabled={!selectedRoom}
            >
              <option value="">{selectedRoom ? "Select bed" : "Select room first"}</option>
              {availableBeds.map((bed) => (
                <option key={bed.bed_number} value={bed.bed_number}>
                  {bed.bed_number}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">ID proof upload</label>
            <input
              type="file"
              className="block w-full text-sm text-slate-600"
              onChange={(event) => setIdProofFile(event.target.files?.[0] || null)}
            />
          </div>

          <button type="submit" className="primary-button w-full text-base" disabled={saving}>
            <span>{saving ? "..." : "+"}</span>
            <span>{saving ? "Saving tenant" : "Save Tenant"}</span>
          </button>
        </form>

        <div className="card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Tenant List</h3>
              <p className="text-sm text-slate-500">{tenants.length} tenant records</p>
            </div>
            <input
              type="text"
              className="input-field md:max-w-xs"
              placeholder="Search tenant"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="mt-5 grid gap-4">
            {filteredTenants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-blue-200 p-6 text-center text-sm text-slate-500">
                No tenants match your search.
              </div>
            ) : (
              filteredTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="cursor-pointer rounded-3xl border border-blue-100 bg-slate-50 p-4 transition hover:border-brand-300 hover:bg-white"
                  onClick={() => setSelectedTenant(tenant)}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{tenant.name}</p>
                      <p className="text-sm text-slate-500">{tenant.phone}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-white px-3 py-1 text-brand-700">
                          {tenant.floor_name || "No floor"} / Room {tenant.room_number || "-"} / {tenant.bed_number || "No bed"}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-brand-700">{tenant.profession}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-brand-700">{tenant.email}</span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{tenant.payment_status}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEditClick(tenant);
                        }}
                        className="secondary-button"
                      >
                        <span>✏️</span>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(tenant.id);
                        }}
                        className="secondary-button"
                      >
                        <span>🗑</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {selectedTenant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6">
          <div className="card max-h-full w-full max-w-3xl overflow-y-auto p-0">
            <div className="flex items-center justify-between border-b border-blue-100 px-6 py-5">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedTenant.name}</h3>
                <p className="text-sm text-slate-500">Tenant details and documents</p>
              </div>
              <button type="button" onClick={() => setSelectedTenant(null)} className="secondary-button px-4 py-2">
                Close
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Mobile</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{selectedTenant.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Email</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{selectedTenant.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Address</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{selectedTenant.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Profession</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{selectedTenant.profession}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Date of Joining</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{selectedTenant.join_date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Emergency Contact</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {selectedTenant.emergency_contact || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Floor / Room / Bed</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {selectedTenant.floor_name || "No floor"} / Room {selectedTenant.room_number || "-"} /{" "}
                    {selectedTenant.bed_number || "No bed"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Rent</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">Rs. {selectedTenant.rent}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Payment Status</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{selectedTenant.payment_status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">ID Proof Number</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {selectedTenant.id_proof_number || "Not provided"}
                  </p>
                </div>
                <div className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">ID Proof File</p>
                  {selectedTenant.id_proof_url ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a
                        href={buildApiAssetUrl(selectedTenant.id_proof_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="primary-button"
                      >
                        View Proof
                      </a>
                      <a
                        href={buildApiAssetUrl(selectedTenant.id_proof_url)}
                        download={selectedTenant.id_proof_name || "id-proof"}
                        className="secondary-button"
                      >
                        Download Proof
                      </a>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No proof uploaded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingTenant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6">
          <div className="card max-h-full w-full max-w-3xl overflow-y-auto p-0">
            <div className="flex items-center justify-between border-b border-blue-100 px-6 py-5">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Edit Tenant</h3>
                <p className="text-sm text-slate-500">Update tenant information</p>
              </div>
              <button type="button" onClick={() => setEditingTenant(null)} className="secondary-button px-4 py-2">
                Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="input-field"
                  placeholder="Tenant name"
                  value={editFormData.name}
                  onChange={(event) => setEditFormData({ ...editFormData, name: event.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Mobile number"
                  value={editFormData.phone}
                  onChange={(event) => setEditFormData({ ...editFormData, phone: event.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Profession"
                  value={editFormData.profession}
                  onChange={(event) => setEditFormData({ ...editFormData, profession: event.target.value })}
                />
                <input
                  className="input-field"
                  type="date"
                  value={editFormData.join_date}
                  onChange={(event) => setEditFormData({ ...editFormData, join_date: event.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Emergency contact"
                  value={editFormData.emergency_contact}
                  onChange={(event) => setEditFormData({ ...editFormData, emergency_contact: event.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="ID proof number"
                  value={editFormData.id_proof_number}
                  onChange={(event) => setEditFormData({ ...editFormData, id_proof_number: event.target.value })}
                />
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  placeholder="Monthly rent"
                  value={editFormData.rent}
                  onChange={(event) => setEditFormData({ ...editFormData, rent: event.target.value })}
                />
                <select
                  className="input-field"
                  value={editFormData.room_id}
                  onChange={(event) => setEditFormData({ ...editFormData, room_id: event.target.value, bed_number: "" })}
                >
                  <option value="">Assign room later</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.floor_name} - Room {room.room_number} ({room.available_beds} beds free)
                    </option>
                  ))}
                </select>
                {editFormData.room_id ? (
                  <select
                    className="input-field"
                    value={editFormData.bed_number}
                    onChange={(event) => setEditFormData({ ...editFormData, bed_number: event.target.value })}
                  >
                    <option value="">Select bed</option>
                    {rooms
                      .find((r) => r.id === editFormData.room_id)
                      ?.beds.filter((b) => b.status === "Available" || b.bed_number === editingTenant.bed_number)
                      .map((bed) => (
                        <option key={bed.bed_number} value={bed.bed_number}>
                          {bed.bed_number}
                        </option>
                      ))}
                  </select>
                ) : null}
              </div>

              <textarea
                className="input-field min-h-24 resize-none"
                placeholder="Address"
                value={editFormData.address}
                onChange={(event) => setEditFormData({ ...editFormData, address: event.target.value })}
              />

              {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

              <button type="submit" className="primary-button w-full text-base" disabled={saving}>
                <span>{saving ? "Saving..." : "Update Tenant"}</span>
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TenantsPage;
