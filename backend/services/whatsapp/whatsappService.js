import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
|--------------------------------------------------------------------------
| WhatsApp Session Storage
|--------------------------------------------------------------------------
|
| Every gym gets its own WhatsApp session folder.
|
| backend/
|   whatsapp-sessions/
|      gymId1/
|      gymId2/
|      gymId3/
|
*/

const sessionsDirectory = path.join(
  __dirname,
  "../../whatsapp-sessions"
);

if (!fs.existsSync(sessionsDirectory)) {
  fs.mkdirSync(sessionsDirectory, {
    recursive: true,
  });
}

/*
|--------------------------------------------------------------------------
| Active Connections
|--------------------------------------------------------------------------
*/

const connections = new Map();

/*
|--------------------------------------------------------------------------
| Get Session Directory
|--------------------------------------------------------------------------
*/

const getSessionDirectory = (gymId) => {
  return path.join(
    sessionsDirectory,
    String(gymId)
  );
};

/*
|--------------------------------------------------------------------------
| Get Existing Connection
|--------------------------------------------------------------------------
*/

export const getWhatsAppStatus = (gymId) => {
  const connection = connections.get(
    String(gymId)
  );

  if (!connection) {
    return {
      connected: false,
      connecting: false,
      qr: null,
      number: null,
    };
  }

  return {
    connected: connection.connected,
    connecting: connection.connecting,
    qr: connection.qr,
    number: connection.number,
  };
};

/*
|--------------------------------------------------------------------------
| Connect WhatsApp
|--------------------------------------------------------------------------
*/

export const connectWhatsApp = async (
  gymId
) => {
  const normalizedGymId = String(gymId);

  /*
  |--------------------------------------------------------------------------
  | Already Connected / Connecting
  |--------------------------------------------------------------------------
  */

  const existing =
    connections.get(normalizedGymId);

  if (
    existing?.connected ||
    existing?.connecting
  ) {
    return getWhatsAppStatus(
      normalizedGymId
    );
  }

  const sessionDirectory =
    getSessionDirectory(
      normalizedGymId
    );

  if (!fs.existsSync(sessionDirectory)) {
    fs.mkdirSync(sessionDirectory, {
      recursive: true,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Create Initial State
  |--------------------------------------------------------------------------
  */

  connections.set(
    normalizedGymId,
    {
      connected: false,
      connecting: true,
      qr: null,
      number: null,
      socket: null,
    }
  );

  try {
    const {
      state,
      saveCreds,
    } = await useMultiFileAuthState(
      sessionDirectory
    );

    const socket = makeWASocket({
      auth: state,

      logger: pino({
        level: "silent",
      }),

      printQRInTerminal: false,

      generateHighQualityLinkPreview: false,
    });

    const connectionState =
      connections.get(
        normalizedGymId
      );

    if (connectionState) {
      connectionState.socket =
        socket;
    }

    /*
    |--------------------------------------------------------------------------
    | Save Credentials
    |--------------------------------------------------------------------------
    */

    socket.ev.on(
      "creds.update",
      saveCreds
    );

    /*
    |--------------------------------------------------------------------------
    | Connection Updates
    |--------------------------------------------------------------------------
    */

    socket.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect,
          qr,
        } = update;

        const current =
          connections.get(
            normalizedGymId
          );

        if (!current) {
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | QR CODE
        |--------------------------------------------------------------------------
        */

        if (qr) {
          try {
            current.qr =
              await QRCode.toDataURL(
                qr,
                {
                  width: 320,
                  margin: 2,
                }
              );

            current.connected =
              false;

            current.connecting =
              true;

            console.log(
              `📱 WhatsApp QR generated for gym ${normalizedGymId}`
            );
          } catch (error) {
            console.error(
              "QR generation error:",
              error
            );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | CONNECTED
        |--------------------------------------------------------------------------
        */

        if (
          connection ===
          "open"
        ) {
          const connectedNumber =
            socket.user?.id
              ?.split(":")[0]
              ?.replace(
                "@s.whatsapp.net",
                ""
              ) || null;

          current.connected =
            true;

          current.connecting =
            false;

          current.qr = null;

          current.number =
            connectedNumber;

          console.log(
            `✅ WhatsApp connected for gym ${normalizedGymId}${
              connectedNumber
                ? ` — ${connectedNumber}`
                : ""
            }`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | DISCONNECTED
        |--------------------------------------------------------------------------
        */

        if (
          connection ===
          "close"
        ) {
          current.connected =
            false;

          current.connecting =
            false;

          current.qr = null;

          const statusCode =
            new Boom(
              lastDisconnect?.error
            )?.output
              ?.statusCode;

          const loggedOut =
            statusCode ===
            DisconnectReason
              .loggedOut;

          const connectionClosed =
            statusCode ===
            DisconnectReason
              .connectionClosed;

          const connectionLost =
            statusCode ===
            DisconnectReason
              .connectionLost;

          const restartRequired =
            statusCode ===
            DisconnectReason
              .restartRequired;

          console.log(
            `⚠️ WhatsApp disconnected for gym ${normalizedGymId}. Status: ${statusCode}`
          );

          /*
          |--------------------------------------------------------------------------
          | Logged Out
          |--------------------------------------------------------------------------
          |
          | If the user explicitly logged out,
          | don't automatically reconnect.
          |
          */

          if (loggedOut) {
            console.log(
              `🔴 WhatsApp logged out for gym ${normalizedGymId}`
            );

            connections.delete(
              normalizedGymId
            );

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | Reconnect
          |--------------------------------------------------------------------------
          */

          if (
            connectionClosed ||
            connectionLost ||
            restartRequired
          ) {
            console.log(
              `🔄 Reconnecting WhatsApp for gym ${normalizedGymId}...`
            );

            connections.delete(
              normalizedGymId
            );

            setTimeout(() => {
              connectWhatsApp(
                normalizedGymId
              ).catch(
                (error) => {
                  console.error(
                    "WhatsApp reconnect error:",
                    error
                  );
                }
              );
            }, 3000);

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | Unknown Disconnect
          |--------------------------------------------------------------------------
          */

          connections.delete(
            normalizedGymId
          );
        }
      }
    );

    return getWhatsAppStatus(
      normalizedGymId
    );
  } catch (error) {
    console.error(
      `WhatsApp connection error for gym ${normalizedGymId}:`,
      error
    );

    connections.delete(
      normalizedGymId
    );

    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| Disconnect WhatsApp
|--------------------------------------------------------------------------
*/

export const disconnectWhatsApp =
  async (gymId) => {
    const normalizedGymId =
      String(gymId);

    const connection =
      connections.get(
        normalizedGymId
      );

    try {
      if (
        connection?.socket
      ) {
        await connection.socket.logout();
      }
    } catch (error) {
      console.error(
        "WhatsApp logout error:",
        error
      );
    }

    connections.delete(
      normalizedGymId
    );

    return {
      success: true,
    };
  };

/*
|--------------------------------------------------------------------------
| Reset WhatsApp Session
|--------------------------------------------------------------------------
*/

export const resetWhatsApp =
  async (gymId) => {
    const normalizedGymId =
      String(gymId);

    const connection =
      connections.get(
        normalizedGymId
      );

    /*
    |--------------------------------------------------------------------------
    | Close Existing Socket
    |--------------------------------------------------------------------------
    */

    try {
      if (
        connection?.socket
      ) {
        connection.socket.end(
          undefined
        );
      }
    } catch (error) {
      console.error(
        "WhatsApp socket close error:",
        error
      );
    }

    connections.delete(
      normalizedGymId
    );

    /*
    |--------------------------------------------------------------------------
    | Delete Session Files
    |--------------------------------------------------------------------------
    */

    const sessionDirectory =
      getSessionDirectory(
        normalizedGymId
      );

    if (
      fs.existsSync(
        sessionDirectory
      )
    ) {
      fs.rmSync(
        sessionDirectory,
        {
          recursive: true,
          force: true,
        }
      );
    }

    console.log(
      `🗑️ WhatsApp session reset for gym ${normalizedGymId}`
    );

    return {
      success: true,
    };
  };

/*
|--------------------------------------------------------------------------
| Initialize Existing Sessions
|--------------------------------------------------------------------------
|
| When the server starts, reconnect gyms that
| already have WhatsApp credentials.
|
*/

export const initializeWhatsAppSessions =
  async () => {
    if (
      !fs.existsSync(
        sessionsDirectory
      )
    ) {
      return;
    }

    const gymDirectories =
      fs
        .readdirSync(
          sessionsDirectory,
          {
            withFileTypes: true,
          }
        )
        .filter(
          (item) =>
            item.isDirectory()
        );

    for (const gymDirectory of gymDirectories) {
      const gymId =
        gymDirectory.name;

      try {
        console.log(
          `🔄 Restoring WhatsApp session for gym ${gymId}...`
        );

        await connectWhatsApp(
          gymId
        );
      } catch (error) {
        console.error(
          `Failed to restore WhatsApp session for gym ${gymId}:`,
          error
        );
      }
    }
  };
  export const sendWhatsAppMessage = async (
  gymId,
  phone,
  message
) => {
  const normalizedGymId = String(gymId);

  const connection =
    connections.get(normalizedGymId);

  if (!connection) {
    throw new Error(
      "WhatsApp is not connected."
    );
  }

  if (!connection.connected) {
    throw new Error(
      "WhatsApp is not connected."
    );
  }

  if (!connection.socket) {
    throw new Error(
      "WhatsApp connection is unavailable."
    );
  }

  if (!phone) {
    throw new Error(
      "Member phone number is required."
    );
  }

  if (!message || !message.trim()) {
    throw new Error(
      "Message cannot be empty."
    );
  }

  let cleanedPhone = String(phone)
    .trim()
    .replace(/[^\d+]/g, "");

  if (cleanedPhone.startsWith("+")) {
    cleanedPhone =
      cleanedPhone.substring(1);
  }

  if (cleanedPhone.startsWith("00")) {
    cleanedPhone =
      cleanedPhone.substring(2);
  }

  // Pakistan local format:
  // 03001234567 → 923001234567
  if (
    cleanedPhone.startsWith("0") &&
    cleanedPhone.length === 11
  ) {
    cleanedPhone =
      "92" +
      cleanedPhone.substring(1);
  }

  // Remove any accidental @s.whatsapp.net
  cleanedPhone =
    cleanedPhone.replace(
      "@s.whatsapp.net",
      ""
    );

  if (
    !/^\d{10,15}$/.test(
      cleanedPhone
    )
  ) {
    throw new Error(
      "Invalid WhatsApp phone number."
    );
  }

  const jid =
    `${cleanedPhone}@s.whatsapp.net`;

  const [result] =
    await connection.socket.onWhatsApp(
      jid
    );

  if (!result?.exists) {
    throw new Error(
      "This phone number is not registered on WhatsApp."
    );
  }

  const response =
    await connection.socket.sendMessage(
      jid,
      {
        text: message.trim(),
      }
    );

  return {
    success: true,
    messageId:
      response?.key?.id || null,
    phone: cleanedPhone,
  };
};