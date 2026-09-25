import {
  connectWhatsApp,
  getWhatsAppStatus,
  disconnectWhatsApp,
  resetWhatsApp,
  sendWhatsAppMessage,
} from "../services/whatsapp/whatsappService.js";

export const getStatus = async (
  req,
  res
) => {
  try {
    const gymId = req.gymId;

    const status =
      getWhatsAppStatus(gymId);

    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error(
      "WhatsApp status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get WhatsApp status.",
    });
  }
};

export const connect = async (
  req,
  res
) => {
  try {
    const gymId = req.gymId;

    const status =
      await connectWhatsApp(gymId);

    return res.json({
      success: true,
      message:
        "WhatsApp connection started.",
      data: status,
    });
  } catch (error) {
    console.error(
      "WhatsApp connect error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to start WhatsApp connection.",
    });
  }
};

export const disconnect = async (
  req,
  res
) => {
  try {
    const gymId = req.gymId;

    await disconnectWhatsApp(gymId);

    return res.json({
      success: true,
      message:
        "WhatsApp disconnected.",
    });
  } catch (error) {
    console.error(
      "WhatsApp disconnect error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to disconnect WhatsApp.",
    });
  }
};

export const reset = async (
  req,
  res
) => {
  try {
    const gymId = req.gymId;

    await resetWhatsApp(gymId);

    return res.json({
      success: true,
      message:
        "WhatsApp session reset successfully.",
    });
  } catch (error) {
    console.error(
      "WhatsApp reset error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reset WhatsApp session.",
    });
  }
};

export const sendMessage = async (
  req,
  res
) => {
  try {
    const gymId = req.gymId;

    const {
      phone,
      message,
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number is required.",
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Message is required.",
      });
    }

    const result =
      await sendWhatsAppMessage(
        gymId,
        phone,
        message
      );

    return res.json({
      success: true,
      message:
        "WhatsApp message sent successfully.",
      data: result,
    });
  } catch (error) {
    console.error(
      "WhatsApp send message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to send WhatsApp message.",
    });
  }
};