import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  User,
  Bell,
  Lock,
  LogOut,
  Phone,
  Building,
  MapPin,
  ShieldCheck,
  Trash2,
  Camera,
  Plus,
  CircleX,
  Users,
} from "lucide-react";
import HrShell from "../../components/layouts/HrShell";
import { settingsApi, type Department, type HrMember } from "@/services/api";

/* ─── Types ─── */
type TabKey = "profile" | "organization" | "notifications" | "security";

interface ProfileState {
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
}

interface NotificationState {
  emailOnNewCandidate: boolean;
  emailOnAssessmentComplete: boolean;
  emailOnInterviewScheduled: boolean;
}

interface PasswordState {
  current: string;
  newPassword: string;
  confirm: string;
}

/* ─── Static data (outside component to avoid recreation on every render) ─── */
const TABS: { value: TabKey; icon: LucideIcon; label: string }[] = [
  { value: "profile", icon: User, label: "Profile" },
  { value: "organization", icon: Building, label: "Organization" },
  { value: "notifications", icon: Bell, label: "Notifications" },
  { value: "security", icon: Lock, label: "Security" },
];

const MEMBER_ROLES = ["HR", "Manager", "Lead", "Director", "VP", "CTO", "CEO"];

const EMAIL_NOTIFICATION_ITEMS: {
  key: keyof NotificationState;
  label: string;
  description: string;
}[] = [
  {
    key: "emailOnNewCandidate",
    label: "New Candidate Applied",
    description: "Get notified when a new candidate applies",
  },
  {
    key: "emailOnAssessmentComplete",
    label: "Assessment Completed",
    description: "Receive alerts when candidates complete assessments",
  },
  {
    key: "emailOnInterviewScheduled",
    label: "Interview Scheduled",
    description: "Get notified when interviews are scheduled",
  },
];

/* ─── Shared styles ─── */
const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100";

/* ─── Toggle switch (pure CSS, no external dependency) ─── */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ─── Page ─── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const [profile, setProfile] = useState<ProfileState>({
    name: "HR Admin",
    email: "admin@hireai.com",
    phone: "+1 (555) 123-4567",
    company: "TechCorp Inc",
    location: "San Francisco, CA",
  });

  const [notifications, setNotifications] = useState<NotificationState>({
    emailOnNewCandidate: true,
    emailOnAssessmentComplete: true,
    emailOnInterviewScheduled: true,
  });

  const [passwords, setPasswords] = useState<PasswordState>({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Organization state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<HrMember[]>([]);
  const [newDept, setNewDept] = useState("");
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "HR" });

  useEffect(() => {
    if (activeTab === "organization") {
      settingsApi.getDepartments().then(setDepartments).catch(() => {});
      settingsApi.getMembers().then(setMembers).catch(() => {});
    }
  }, [activeTab]);

  const handleAddDept = async () => {
    if (!newDept.trim()) return;
    try {
      const dept = await settingsApi.createDepartment(newDept);
      setDepartments((prev) => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)));
      setNewDept("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add department");
    }
  };

  const handleDeleteDept = async (id: number) => {
    try {
      await settingsApi.deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert("Failed to delete department");
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim()) return;
    try {
      const member = await settingsApi.createMember(newMember);
      setMembers((prev) => [...prev, member].sort((a, b) => a.name.localeCompare(b.name)));
      setNewMember({ name: "", email: "", role: "HR" });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  const handleDeleteMember = async (id: number) => {
    try {
      await settingsApi.deleteMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Failed to delete member");
    }
  };

  const handleProfileChange = (field: keyof ProfileState, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (key: keyof NotificationState) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <HrShell activeItem="settings">
      <div className="mx-auto max-w-5xl py-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account, notifications, and security
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-8 grid grid-cols-4 gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          {TABS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ─── PROFILE TAB ─── */}
        {activeTab === "profile" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Information
              </h2>
              <p className="text-sm text-gray-500">
                Update your personal and company details
              </p>
            </div>

            <div className="space-y-6 px-6 pt-4 pb-6">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-md">
                    HA
                  </div>
                  <button
                    type="button"
                    aria-label="Change profile picture"
                    className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <Camera className="h-3 w-3 text-gray-600" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Profile Picture
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    JPG, PNG or GIF (Max 5MB)
                  </p>
                  <button
                    type="button"
                    className="mt-2 h-8 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                  >
                    Upload Photo
                  </button>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Form fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleProfileChange("name", e.target.value)}
                      placeholder="Your name"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                      placeholder="your.email@company.com"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      Phone
                    </label>
                    <input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="company" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <Building className="h-3.5 w-3.5 text-gray-400" />
                      Company
                    </label>
                    <input
                      id="company"
                      value={profile.company}
                      onChange={(e) => handleProfileChange("company", e.target.value)}
                      placeholder="Company name"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="location" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    Location
                  </label>
                  <input
                    id="location"
                    value={profile.location}
                    onChange={(e) => handleProfileChange("location", e.target.value)}
                    placeholder="City, State"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="h-9 rounded-lg border border-gray-200 px-5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-9 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ORGANIZATION TAB ─── */}
        {activeTab === "organization" && (
          <div className="space-y-6">
            {/* Departments */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
                <p className="text-sm text-gray-500">Manage teams that appear in assessment creation</p>
              </div>
              <div className="px-6 pt-2 pb-6 space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddDept(); } }}
                    placeholder="New department name"
                    className={INPUT_CLASS + " flex-1"}
                  />
                  <button
                    type="button"
                    onClick={handleAddDept}
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <span
                      key={dept.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                    >
                      <Building className="h-3.5 w-3.5 text-gray-400" />
                      {dept.name}
                      <button
                        type="button"
                        onClick={() => handleDeleteDept(dept.id)}
                        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                        <CircleX className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  {departments.length === 0 && (
                    <p className="text-sm text-gray-400">No departments yet. Add one above.</p>
                  )}
                </div>
              </div>
            </div>

            {/* HR Members */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                <p className="text-sm text-gray-500">People available as hiring managers and interviewers</p>
              </div>
              <div className="px-6 pt-2 pb-6 space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newMember.name}
                    onChange={(e) => setNewMember((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Name"
                    className={INPUT_CLASS + " flex-1"}
                  />
                  <input
                    value={newMember.email}
                    onChange={(e) => setNewMember((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email (optional)"
                    className={INPUT_CLASS + " flex-1"}
                  />
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember((prev) => ({ ...prev, role: e.target.value }))}
                    className="h-10 w-32 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  >
                    {MEMBER_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>

                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.email || "No email"} · {m.role}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-sm text-gray-400">No team members yet. Add one above.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── NOTIFICATIONS TAB ─── */}
        {activeTab === "notifications" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
              <p className="text-sm text-gray-500">Choose which emails you want to receive</p>
            </div>
            <div className="px-6 pt-2 pb-4">
              {EMAIL_NOTIFICATION_ITEMS.map((item, idx, arr) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{item.description}</p>
                    </div>
                    <Toggle
                      checked={notifications[item.key]}
                      onChange={() => handleNotificationChange(item.key)}
                    />
                  </div>
                  {idx < arr.length - 1 && <hr className="border-gray-100" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── SECURITY TAB ─── */}
        {activeTab === "security" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Password &amp; Security</h2>
              <p className="text-sm text-gray-500">Manage your account security settings</p>
            </div>

            <div className="space-y-6 px-6 pt-4 pb-6">
              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Change Password</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="current-password" className="text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords((prev) => ({ ...prev, current: e.target.value }))}
                      placeholder="Enter current password"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
                      placeholder="Confirm new password"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="h-9 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Update Password
                </button>
              </div>

              <hr className="border-gray-100" />

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Two-Factor Authentication</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="h-8 rounded-lg border border-gray-200 px-4 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Enable
                </button>
              </div>

              <hr className="border-gray-100" />

              {/* Danger Zone */}
              <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-600">Danger Zone</p>
                <p className="text-xs text-red-500">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-red-300 px-4 text-sm text-red-600 transition-colors hover:border-red-400 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-red-600">
                      Are you absolutely sure?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="h-8 rounded-lg bg-red-600 px-4 text-sm text-white transition-colors hover:bg-red-700"
                      >
                        Yes, delete my account
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="h-8 rounded-lg border border-gray-200 px-4 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Sign Out */}
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

      </div>
    </HrShell>
  );
}
