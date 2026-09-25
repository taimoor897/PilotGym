import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";

import {
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  MessageCircle,
  Power,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";

export default function WhatsAppAutomation() {
  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  const token =
    localStorage.getItem("gympilot_token");

  const [settings, setSettings] =
    useState(null);

  const [whatsapp, setWhatsapp] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  /*
   * ========================================================
   * LOAD SETTINGS
   * ========================================================
   */

  const loadSettings = async () => {
    try {
      const response = await fetch(
        `${API_URL}/whatsapp-automation/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load automation settings."
        );
      }

      setSettings(data.settings);
    } catch (error) {
      console.error(
        "Load automation settings error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load settings",
        text:
          error.message ||
          "Something went wrong.",
        confirmButtonText: "OK",
      });
    }
  };

  /*
   * ========================================================
   * LOAD WHATSAPP STATUS
   * ========================================================
   */

  const loadWhatsAppStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/whatsapp/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load WhatsApp status."
        );
      }

      setWhatsapp(data.data);
    } catch (error) {
      console.error(
        "Load WhatsApp status error:",
        error
      );

      setWhatsapp({
        connected: false,
        connecting: false,
        number: null,
      });
    }
  };

  /*
   * ========================================================
   * INITIAL LOAD
   * ========================================================
   */

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      await Promise.all([
        loadSettings(),
        loadWhatsAppStatus(),
      ]);

      setLoading(false);
    };

    load();
  }, []);

  /*
   * ========================================================
   * REFRESH
   * ========================================================
   */

  const handleRefresh = async () => {
    setRefreshing(true);

    await Promise.all([
      loadSettings(),
      loadWhatsAppStatus(),
    ]);

    setRefreshing(false);
  };

  /*
   * ========================================================
   * UPDATE SETTING
   * ========================================================
   */

  const updateSetting = (
    section,
    key,
    value
  ) => {
    setSettings((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [key]: value,
      },
    }));
  };

  /*
   * ========================================================
   * SAVE SETTINGS
   * ========================================================
   */

  const saveSettings = async () => {
    if (!settings) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/whatsapp-automation/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(settings),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save settings."
        );
      }

      setSettings(data.settings);

      await Swal.fire({
        icon: "success",
        title: "Settings saved",
        text:
          "Your WhatsApp automation settings have been updated.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Save automation settings error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text:
          error.message ||
          "Unable to save settings.",
        confirmButtonText: "OK",
      });
    } finally {
      setSaving(false);
    }
  };

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading || !settings) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10">
              <Loader2
                size={24}
                className="animate-spin text-blue-600"
              />
            </div>

            <p className="text-sm font-medium text-slate-500">
              Loading automation settings...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isConnected =
    whatsapp?.connected;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-6 flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Bot
                    size={17}
                    className="text-white"
                  />
                </div>

                <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Automation Center
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                WhatsApp Automations
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Automatically send membership and payment
                reminders to your gym members.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}

                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>

          {/* ==================================================
              TOP STATUS BAR
          ================================================== */}

          <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">

            {/* WhatsApp */}

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                    <MessageCircle
                      size={20}
                      className="text-green-600"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      WhatsApp
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {isConnected &&
                      whatsapp?.number
                        ? `+${whatsapp.number}`
                        : "No account connected"}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    <XCircle size={13} />
                    Disconnected
                  </span>
                )}
              </div>
            </div>

            {/* Master switch */}

            <div
              className={`rounded-xl border p-4 transition ${
                settings.enabled
                  ? "border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      settings.enabled
                        ? "bg-blue-600/10 text-blue-600"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    }`}
                  >
                    <Power size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Automation
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {settings.enabled
                        ? "Currently active"
                        : "Currently paused"}
                    </p>
                  </div>
                </div>

                <Toggle
                  enabled={
                    settings.enabled
                  }
                  onChange={(value) =>
                    setSettings(
                      (previous) => ({
                        ...previous,
                        enabled: value,
                      })
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* ==================================================
              CONNECTION WARNING
          ================================================== */}

          {!isConnected && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <MessageCircle
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                  WhatsApp connection required
                </p>

                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-500">
                  Automations are configured, but messages
                  cannot be sent until WhatsApp is connected.
                </p>
              </div>
            </div>
          )}

          {/* ==================================================
              SETTINGS
          ================================================== */}

          <div className="grid gap-5 lg:grid-cols-2">

            {/* =================================================
                MEMBERSHIP
            ================================================= */}

            <SettingsCard
              icon={
                <UserCheck
                  size={19}
                />
              }
              iconClass="bg-blue-600/10 text-blue-600"
              title="Membership reminders"
              description="Automatically notify members around their membership expiry."
            >
              <AutomationRow
                icon={<Clock3 size={17} />}
                title="7 days before"
                description="Give members a one-week renewal reminder."
                enabled={
                  settings.membership
                    ?.sevenDays
                }
                onChange={(value) =>
                  updateSetting(
                    "membership",
                    "sevenDays",
                    value
                  )
                }
              />

              <AutomationRow
                icon={<Clock3 size={17} />}
                title="3 days before"
                description="Remind members that their membership is approaching expiry."
                enabled={
                  settings.membership
                    ?.threeDays
                }
                onChange={(value) =>
                  updateSetting(
                    "membership",
                    "threeDays",
                    value
                  )
                }
              />

              <AutomationRow
                icon={<Clock3 size={17} />}
                title="1 day before"
                description="Send a final reminder before expiry."
                enabled={
                  settings.membership
                    ?.oneDay
                }
                onChange={(value) =>
                  updateSetting(
                    "membership",
                    "oneDay",
                    value
                  )
                }
              />

              <AutomationRow
                icon={<Sparkles size={17} />}
                title="Expiry day"
                description="Notify members on the day their membership expires."
                enabled={
                  settings.membership
                    ?.expiryDay
                }
                onChange={(value) =>
                  updateSetting(
                    "membership",
                    "expiryDay",
                    value
                  )
                }
              />

              <AutomationRow
                icon={
                  <RefreshCw
                    size={17}
                  />
                }
                title="After expiry"
                description="Follow up with expired members during the next seven days."
                enabled={
                  settings.membership
                    ?.afterExpiry
                }
                onChange={(value) =>
                  updateSetting(
                    "membership",
                    "afterExpiry",
                    value
                  )
                }
                last
              />
            </SettingsCard>

            {/* =================================================
                PAYMENTS
            ================================================= */}

            <SettingsCard
              icon={
                <CreditCard
                  size={19}
                />
              }
              iconClass="bg-emerald-500/10 text-emerald-600"
              title="Payment reminders"
              description="Automatically follow up on outstanding member payments."
            >
              <AutomationRow
                icon={
                  <CreditCard
                    size={17}
                  />
                }
                title="Payment due"
                description="Notify members when a payment reaches its due date."
                enabled={
                  settings.payments
                    ?.due
                }
                onChange={(value) =>
                  updateSetting(
                    "payments",
                    "due",
                    value
                  )
                }
              />

              <AutomationRow
                icon={
                  <Clock3 size={17} />
                }
                title="Payment overdue"
                description="Send the first reminder one day after the due date."
                enabled={
                  settings.payments
                    ?.overdue
                }
                onChange={(value) =>
                  updateSetting(
                    "payments",
                    "overdue",
                    value
                  )
                }
              />

              <AutomationRow
                icon={
                  <RefreshCw
                    size={17}
                  />
                }
                title="Repeated overdue"
                description="Continue following up on unpaid payments."
                enabled={
                  settings.payments
                    ?.repeated
                }
                onChange={(value) =>
                  updateSetting(
                    "payments",
                    "repeated",
                    value
                  )
                }
              />

              {/* Repeat interval */}

              <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Repeat interval
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Days between repeated reminders.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={
                      settings.repeatOverdueDays ??
                      1
                    }
                    onChange={(event) =>
                      setSettings(
                        (previous) => ({
                          ...previous,
                          repeatOverdueDays:
                            Number(
                              event.target
                                .value
                            ),
                        })
                      )
                    }
                    className="h-9 w-16 rounded-lg border border-slate-200 bg-white text-center text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <span className="text-xs font-medium text-slate-500">
                    days
                  </span>
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* ==================================================
              HOW IT WORKS
          ================================================== */}

          <div className="mt-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-4 p-5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                <Settings2 size={19} />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  How automation works
                </h3>

                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                  GymPilot checks your enabled automations
                  automatically and sends the appropriate
                  WhatsApp message when the conditions are met.
                  Successful messages are recorded to prevent
                  duplicate reminders.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <FeatureBadge text="Duplicate protection" />
                  <FeatureBadge text="Per-gym settings" />
                  <FeatureBadge text="WhatsApp aware" />
                  <FeatureBadge text="Automatic processing" />
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              SAVE
          ================================================== */}

          <div className="mt-5 flex justify-end pb-8">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {saving
                ? "Saving..."
                : "Save Automation Settings"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/*
 * ==========================================================
 * SETTINGS CARD
 * ==========================================================
 */

function SettingsCard({
  icon,
  iconClass,
  title,
  description,
  children,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
          >
            {icon}
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}

/*
 * ==========================================================
 * AUTOMATION ROW
 * ==========================================================
 */

function AutomationRow({
  icon,
  title,
  description,
  enabled,
  onChange,
  last = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
        !last
          ? "border-b border-slate-100 dark:border-slate-800"
          : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            enabled
              ? "bg-blue-600/10 text-blue-600"
              : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <Toggle
        enabled={enabled}
        onChange={onChange}
      />
    </div>
  );
}

/*
 * ==========================================================
 * TOGGLE
 * ==========================================================
 */

function Toggle({
  enabled,
  onChange,
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!enabled)
      }
      aria-pressed={enabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-200 ${
        enabled
          ? "bg-blue-600"
          : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
          enabled
            ? "left-6"
            : "left-1"
        }`}
      />

      {enabled && (
        <Check
          size={10}
          strokeWidth={3}
          className="absolute left-[7px] top-[7px] text-blue-600"
        />
      )}
    </button>
  );
}

/*
 * ==========================================================
 * FEATURE BADGE
 * ==========================================================
 */

function FeatureBadge({ text }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <CheckCircle2
        size={12}
        className="text-emerald-500"
      />

      {text}
    </span>
  );
}