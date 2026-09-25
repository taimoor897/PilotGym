import { useEffect, useState } from "react";
import {
  MessageCircle,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function WhatsApp() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const [connecting, setConnecting] =
    useState(false);

  const [disconnecting, setDisconnecting] =
    useState(false);

  const [resetting, setResetting] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | API REQUEST
  |--------------------------------------------------------------------------
  */

  const apiRequest = async (
    endpoint,
    options = {}
  ) => {
    const token =
      localStorage.getItem(
        "gympilot_token"
      );

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          Authorization: `Bearer ${token}`,

          ...(options.headers || {}),
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Something went wrong."
      );
    }

    return data;
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD STATUS
  |--------------------------------------------------------------------------
  */

  const loadStatus = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response =
        await apiRequest(
          "/whatsapp/status"
        );

      setStatus(
        response.data
      );
    } catch (error) {
      console.error(
        "WhatsApp status error:",
        error
      );

      setStatus({
        connected: false,
        connecting: false,
        qr: null,
        number: null,
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL STATUS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadStatus();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | STATUS POLLING
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const interval =
      setInterval(() => {
        loadStatus(false);
      }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CONNECT
  |--------------------------------------------------------------------------
  */

  const connectWhatsApp =
    async () => {
      try {
        setConnecting(true);

        const response =
          await apiRequest(
            "/whatsapp/connect",
            {
              method: "POST",
            }
          );

        setStatus(
          response.data
        );
      } catch (error) {
        console.error(
          "WhatsApp connect error:",
          error
        );

        Swal.fire({
          icon: "error",
          title: "Connection failed",
          text:
            error.message ||
            "Unable to start WhatsApp connection.",
          confirmButtonColor:
            "#4f46e5",
        });
      } finally {
        setConnecting(false);

        await loadStatus(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | DISCONNECT
  |--------------------------------------------------------------------------
  */

  const disconnectWhatsApp =
    async () => {
      const result =
        await Swal.fire({
          icon: "warning",
          title:
            "Disconnect WhatsApp?",
          text:
            "Your GymPilot WhatsApp connection will be disconnected.",
          showCancelButton: true,
          confirmButtonText:
            "Disconnect",
          cancelButtonText:
            "Cancel",
          confirmButtonColor:
            "#dc2626",
        });

      if (!result.isConfirmed) {
        return;
      }

      try {
        setDisconnecting(
          true
        );

        await apiRequest(
          "/whatsapp/disconnect",
          {
            method: "POST",
          }
        );

        await loadStatus(
          false
        );

        Swal.fire({
          icon: "success",
          title: "Disconnected",
          text:
            "WhatsApp has been disconnected.",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title:
            "Disconnect failed",
          text:
            error.message ||
            "Unable to disconnect WhatsApp.",
          confirmButtonColor:
            "#4f46e5",
        });
      } finally {
        setDisconnecting(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RESET
  |--------------------------------------------------------------------------
  */

  const resetWhatsApp =
    async () => {
      const result =
        await Swal.fire({
          icon: "warning",
          title:
            "Reset WhatsApp session?",
          text:
            "This will remove the saved WhatsApp session. You will need to scan a new QR code.",
          showCancelButton: true,
          confirmButtonText:
            "Reset Session",
          cancelButtonText:
            "Cancel",
          confirmButtonColor:
            "#dc2626",
        });

      if (!result.isConfirmed) {
        return;
      }

      try {
        setResetting(true);

        await apiRequest(
          "/whatsapp/reset",
          {
            method: "POST",
          }
        );

        await loadStatus(
          false
        );

        Swal.fire({
          icon: "success",
          title:
            "Session reset",
          text:
            "WhatsApp session has been reset.",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title:
            "Reset failed",
          text:
            error.message ||
            "Unable to reset WhatsApp session.",
          confirmButtonColor:
            "#4f46e5",
        });
      } finally {
        setResetting(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="whatsapp-page">
          <div className="whatsapp-loading">
            <Loader2
              size={30}
              className="spin"
            />

            <p>
              Loading WhatsApp...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isConnected =
    status?.connected === true;

  const isConnecting =
    status?.connecting === true;

  return (
    <DashboardLayout>
      <div className="whatsapp-page">
        {/* HEADER */}

        <div className="whatsapp-header">
          <div>
            <div className="whatsapp-title-row">
              <div className="whatsapp-title-icon">
                <MessageCircle
                  size={22}
                />
              </div>

              <div>
                <h1>
                  WhatsApp
                </h1>

                <p>
                  Connect your gym's
                  WhatsApp number to
                  communicate with
                  members.
                </p>
              </div>
            </div>
          </div>

          <button
            className="whatsapp-refresh"
            onClick={() =>
              loadStatus()
            }
          >
            <RefreshCw
              size={16}
            />

            Refresh
          </button>
        </div>

        {/* MAIN CONNECTION CARD */}

        <div className="whatsapp-card">
          <div className="whatsapp-card-top">
            <div className="whatsapp-card-heading">
              <div className="whatsapp-big-icon">
                <MessageCircle
                  size={26}
                />
              </div>

              <div>
                <h2>
                  WhatsApp Connection
                </h2>

                <p>
                  Connect a WhatsApp
                  account to enable
                  member communication.
                </p>
              </div>
            </div>

            <div
              className={`whatsapp-status ${
                isConnected
                  ? "connected"
                  : isConnecting
                  ? "connecting"
                  : "disconnected"
              }`}
            >
              <span />

              {isConnected
                ? "Connected"
                : isConnecting
                ? "Connecting"
                : "Disconnected"}
            </div>
          </div>

          {/* CONNECTED */}

          {isConnected && (
            <div className="whatsapp-connected-area">
              <div className="whatsapp-connected-icon">
                <CheckCircle2
                  size={34}
                />
              </div>

              <div className="whatsapp-connected-info">
                <h3>
                  WhatsApp is connected
                </h3>

                <p>
                  Your gym's WhatsApp
                  account is ready to
                  send member messages.
                </p>

                {status?.number && (
                  <div className="whatsapp-number">
                    <Smartphone
                      size={16}
                    />

                    <span>
                      +{status.number}
                    </span>
                  </div>
                )}
              </div>

              <div className="whatsapp-connected-actions">
                <button
                  className="whatsapp-danger-button"
                  onClick={
                    disconnectWhatsApp
                  }
                  disabled={
                    disconnecting
                  }
                >
                  {disconnecting ? (
                    <Loader2
                      size={17}
                      className="spin"
                    />
                  ) : (
                    <LogOut
                      size={17}
                    />
                  )}

                  Disconnect
                </button>

                <button
                  className="whatsapp-secondary-button"
                  onClick={
                    resetWhatsApp
                  }
                  disabled={
                    resetting
                  }
                >
                  {resetting ? (
                    <Loader2
                      size={17}
                      className="spin"
                    />
                  ) : (
                    <RotateCcw
                      size={17}
                    />
                  )}

                  Reset Session
                </button>
              </div>
            </div>
          )}

          {/* QR CODE */}

          {!isConnected &&
            status?.qr && (
              <div className="whatsapp-qr-area">
                <div className="whatsapp-qr-box">
                  <img
                    src={status.qr}
                    alt="WhatsApp QR Code"
                  />
                </div>

                <div className="whatsapp-qr-info">
                  <div className="whatsapp-qr-title">
                    <QrCode
                      size={20}
                    />

                    <h3>
                      Scan QR Code
                    </h3>
                  </div>

                  <p>
                    Open WhatsApp on
                    your phone and go to:
                  </p>

                  <div className="whatsapp-steps">
                    <div>
                      <span>
                        1
                      </span>

                      <p>
                        Open WhatsApp
                      </p>
                    </div>

                    <div>
                      <span>
                        2
                      </span>

                      <p>
                        Tap Settings
                      </p>
                    </div>

                    <div>
                      <span>
                        3
                      </span>

                      <p>
                        Select Linked
                        Devices
                      </p>
                    </div>

                    <div>
                      <span>
                        4
                      </span>

                      <p>
                        Tap Link a Device
                        and scan this QR
                      </p>
                    </div>
                  </div>

                  <div className="whatsapp-security-note">
                    <ShieldCheck
                      size={17}
                    />

                    <span>
                      Your WhatsApp
                      session is securely
                      associated with this
                      gym.
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* CONNECT BUTTON */}

          {!isConnected &&
            !status?.qr && (
              <div className="whatsapp-connect-area">
                <div className="whatsapp-connect-visual">
                  <MessageCircle
                    size={42}
                  />
                </div>

                <h3>
                  Connect WhatsApp
                </h3>

                <p>
                  Link your gym's
                  WhatsApp account to
                  start sending member
                  notifications and
                  reminders.
                </p>

                <button
                  className="whatsapp-connect-button"
                  onClick={
                    connectWhatsApp
                  }
                  disabled={
                    connecting
                  }
                >
                  {connecting ? (
                    <>
                      <Loader2
                        size={18}
                        className="spin"
                      />

                      Starting
                      connection...
                    </>
                  ) : (
                    <>
                      <MessageCircle
                        size={18}
                      />

                      Connect WhatsApp
                    </>
                  )}
                </button>
              </div>
            )}
        </div>

        {/* UPCOMING FEATURES */}

        <div className="whatsapp-features-card">
          <div className="whatsapp-features-heading">
            <div>
              <h2>
                WhatsApp Automation
              </h2>

              <p>
                Connect now and unlock
                automated member
                communication.
              </p>
            </div>

            <span>
              Coming next
            </span>
          </div>

          <div className="whatsapp-feature-grid">
            <div className="whatsapp-feature">
              <div>
                📅
              </div>

              <section>
                <h3>
                  Membership Reminders
                </h3>

                <p>
                  Automatically remind
                  members before their
                  membership expires.
                </p>
              </section>
            </div>

            <div className="whatsapp-feature">
              <div>
                💳
              </div>

              <section>
                <h3>
                  Payment Notifications
                </h3>

                <p>
                  Send payment
                  confirmations and
                  outstanding payment
                  reminders.
                </p>
              </section>
            </div>

            <div className="whatsapp-feature">
              <div>
                👋
              </div>

              <section>
                <h3>
                  Member Messages
                </h3>

                <p>
                  Send personalized
                  WhatsApp messages
                  directly from member
                  profiles.
                </p>
              </section>
            </div>

            <div className="whatsapp-feature">
              <div>
                🔔
              </div>

              <section>
                <h3>
                  Automated Alerts
                </h3>

                <p>
                  Re-engage inactive
                  members and keep them
                  connected to your gym.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}