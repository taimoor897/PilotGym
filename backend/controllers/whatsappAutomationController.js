
import WhatsAppAutomationSettings from "../models/WhatsAppAutomationSettings.js";

const defaultSettings = {
  enabled: true,

  membership: {
    sevenDays: true,
    threeDays: true,
    oneDay: true,
    expiryDay: true,
    afterExpiry: true,
  },

  payments: {
    due: true,
    overdue: true,
    repeated: true,
  },

  repeatOverdueDays: 1,
};

export const getAutomationSettings = async (
  req,
  res
) => {
  try {
    let settings =
      await WhatsAppAutomationSettings.findOne({
        gym: req.gymId,
      });

    if (!settings) {
      settings =
        await WhatsAppAutomationSettings.create({
          gym: req.gymId,
          ...defaultSettings,
        });
    }

    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Get WhatsApp automation settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load automation settings.",
    });
  }
};

export const updateAutomationSettings = async (
  req,
  res
) => {
  try {
    const {
      enabled,
      membership,
      payments,
      repeatOverdueDays,
    } = req.body;

    let settings =
      await WhatsAppAutomationSettings.findOne({
        gym: req.gymId,
      });

    if (!settings) {
      settings =
        new WhatsAppAutomationSettings({
          gym: req.gymId,
        });
    }

    if (enabled !== undefined) {
      settings.enabled =
        Boolean(enabled);
    }

    if (membership) {
      if (
        membership.sevenDays !==
        undefined
      ) {
        settings.membership.sevenDays =
          Boolean(
            membership.sevenDays
          );
      }

      if (
        membership.threeDays !==
        undefined
      ) {
        settings.membership.threeDays =
          Boolean(
            membership.threeDays
          );
      }

      if (
        membership.oneDay !==
        undefined
      ) {
        settings.membership.oneDay =
          Boolean(
            membership.oneDay
          );
      }

      if (
        membership.expiryDay !==
        undefined
      ) {
        settings.membership.expiryDay =
          Boolean(
            membership.expiryDay
          );
      }

      if (
        membership.afterExpiry !==
        undefined
      ) {
        settings.membership.afterExpiry =
          Boolean(
            membership.afterExpiry
          );
      }
    }

    if (payments) {
      if (
        payments.due !==
        undefined
      ) {
        settings.payments.due =
          Boolean(
            payments.due
          );
      }

      if (
        payments.overdue !==
        undefined
      ) {
        settings.payments.overdue =
          Boolean(
            payments.overdue
          );
      }

      if (
        payments.repeated !==
        undefined
      ) {
        settings.payments.repeated =
          Boolean(
            payments.repeated
          );
      }
    }

    if (
      repeatOverdueDays !==
      undefined
    ) {
      const days = Number(
        repeatOverdueDays
      );

      if (
        !Number.isFinite(days) ||
        days < 1 ||
        days > 30
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Repeat interval must be between 1 and 30 days.",
        });
      }

      settings.repeatOverdueDays =
        days;
    }

    await settings.save();

    return res.json({
      success: true,
      message:
        "WhatsApp automation settings updated.",
      settings,
    });
  } catch (error) {
    console.error(
      "Update WhatsApp automation settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update automation settings.",
    });
  }
};


