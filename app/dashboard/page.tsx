"use client";

import { useEffect, useMemo, useState } from "react";

type ApiUser = {
  _id: string;
  name: string;
  username: string;
  role: "superadmin" | "user";
  createdAt: string;
  updatedAt: string;
};

type LoginResponse = {
  token: string;
  user: ApiUser;
};

export default function Dashboard() {
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("superadmin");
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<ApiUser | null>(null);
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // create user form
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "superadmin">("user");

  // update profile form
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profilePassword, setProfilePassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("demo_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("demo_token", token);
    else localStorage.removeItem("demo_token");
  }, [token]);

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  async function doLogin() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Login failed");
      const { token: t, user } = data as LoginResponse;
      setToken(t);
      setMe(user);
      setProfileName(user.name || "");
      setProfileUsername(user.username || "");
      setMsg("Logged in");
    } catch (e: any) {
      setMsg(e.message || "Login error");
    } finally {
      setBusy(false);
    }
  }

  async function fetchUsers() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/users", { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch users");
      setUsers(data as ApiUser[]);
      setMsg(`Loaded ${data.length} users`);
    } catch (e: any) {
      setMsg(e.message || "Error loading users");
    } finally {
      setBusy(false);
    }
  }

  async function createUser() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: newName || newUsername,
          username: newUsername,
          password: newPassword,
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Create failed");
      setMsg("User created");
      setNewName(""); setNewUsername(""); setNewPassword(""); setNewRole("user");
      await fetchUsers();
    } catch (e: any) {
      setMsg(e.message || "Create error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      setMsg("User deleted");
      await fetchUsers();
    } catch (e: any) {
      setMsg(e.message || "Delete error");
    } finally {
      setBusy(false);
    }
  }

  async function updateUserRole(id: string, role: "user" | "superadmin") {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");
      setMsg("User updated");
      await fetchUsers();
    } catch (e: any) {
      setMsg(e.message || "Update error");
    } finally {
      setBusy(false);
    }
  }

  async function loadProfile() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/profile", { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch profile");
      setMe(data as ApiUser);
      setProfileName(data.name || "");
      setProfileUsername(data.username || "");
      setMsg("Loaded profile");
    } catch (e: any) {
      setMsg(e.message || "Profile error");
    } finally {
      setBusy(false);
    }
  }

  async function updateProfile() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: profileName,
          username: profileUsername,
          password: profilePassword || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed");
      setMe((data.user ?? data) as ApiUser);
      setProfilePassword("");
      setMsg("Profile updated");
    } catch (e: any) {
      setMsg(e.message || "Update error");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setToken(null);
    setMe(null);
    setUsers(null);
    setMsg("Logged out");
  }

  return (
    <div className="min-h-screen p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold">Admin Test Dashboard</h1>

      {msg && (
        <div className="rounded-md border p-3 text-sm bg-[#f7f7f7] dark:bg-[#111]">
          {msg}
        </div>
      )}

      {/* Auth section */}
      <section className="grid gap-4 rounded-lg border p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Login</h2>
          {token ? (
            <button onClick={logout} className="px-3 py-1 rounded-md border">Logout</button>
          ) : null}
        </div>
        {!token ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="border rounded-md px-3 py-2" placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="border rounded-md px-3 py-2" type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button disabled={busy} onClick={doLogin} className="rounded-md border px-3 py-2 bg-black text-white dark:bg-white dark:text-black disabled:opacity-50">{busy ? "..." : "Login"}</button>
          </div>
        ) : (
          <div className="text-sm break-all">
            <div className="mb-2"><span className="font-medium">Token:</span> {token}</div>
            {me && (
              <div>
                <span className="font-medium">Logged as:</span> {me.username} ({me.role})
              </div>
            )}
          </div>
        )}
      </section>

      {/* Profile section */}
      <section className="grid gap-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">My Profile</h2>
          <div className="flex gap-2">
            <button disabled={!token || busy} onClick={loadProfile} className="px-3 py-1 rounded-md border disabled:opacity-50">Load</button>
            <button disabled={!token || busy} onClick={updateProfile} className="px-3 py-1 rounded-md border disabled:opacity-50">Update</button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="border rounded-md px-3 py-2" placeholder="name" value={profileName} onChange={e => setProfileName(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="username" value={profileUsername} onChange={e => setProfileUsername(e.target.value)} />
          <input className="border rounded-md px-3 py-2" type="password" placeholder="new password (optional)" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} />
        </div>
      </section>

      {/* Users section */}
      <section className="grid gap-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Users (superadmin)</h2>
          <div className="flex gap-2">
            <button disabled={!token || busy} onClick={fetchUsers} className="px-3 py-1 rounded-md border disabled:opacity-50">Refresh</button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <input className="border rounded-md px-3 py-2" placeholder="name" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
          <input className="border rounded-md px-3 py-2" type="password" placeholder="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <select className="border rounded-md px-3 py-2" value={newRole} onChange={e => setNewRole(e.target.value as any)}>
            <option value="user">user</option>
            <option value="superadmin">superadmin</option>
          </select>
        </div>
        <div>
          <button disabled={!token || busy} onClick={createUser} className="rounded-md border px-3 py-2 bg-black text-white dark:bg-white dark:text-black disabled:opacity-50">Create User</button>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-[#f7f7f7] dark:bg-[#111]">
              <tr>
                <th className="text-left p-2 border-r">Username</th>
                <th className="text-left p-2 border-r">Name</th>
                <th className="text-left p-2 border-r">Role</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map(u => (
                <tr key={u._id} className="border-t">
                  <td className="p-2 border-r">{u.username}</td>
                  <td className="p-2 border-r">{u.name}</td>
                  <td className="p-2 border-r">{u.role}</td>
                  <td className="p-2 flex gap-2">
                    <button disabled={!token || busy} onClick={() => updateUserRole(u._id, u.role === "superadmin" ? "user" : "superadmin")} className="px-2 py-1 rounded-md border disabled:opacity-50">
                      {u.role === "superadmin" ? "Make user" : "Make superadmin"}
                    </button>
                    <button disabled={!token || busy} onClick={() => deleteUser(u._id)} className="px-2 py-1 rounded-md border disabled:opacity-50">Delete</button>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-gray-500">No users loaded. Click Refresh.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


