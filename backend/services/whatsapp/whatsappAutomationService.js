import Member from "../../models/Member.js";
import Payment from "../../models/Payment.js";
import Gym from "../../models/Gym.js";
import WhatsAppAutomationLog from "../../models/WhatsAppAutomationLog.js";
import WhatsAppAutomationSettings from "../../models/WhatsAppAutomationSettings.js";

import {
  getWhatsAppStatus,
  sendWhatsAppMessage,
} from "./whatsappService.js";

/*
 * ==========================================================
 * CONFIGURATION
 * ==========================================================
 */

const AUTOMATION_INTERVAL = 5 * 1000;

/*
 * ==========================================================
 * MEMBERSHIP REMINDER CONFIG
 * ==========================================================
 */

const REMINDER_CONFIG = [
  {
    type: "membership_7_days",
    daysBeforeExpiry: 7,
  },
  {
    type: "membership_3_days",
    daysBeforeExpiry: 3,
  },
  {
    type: "membership_1_day",
    daysBeforeExpiry: 1,
  },
  {
    type: "membership_today",
    daysBeforeExpiry: 0,
  },
];

/*
 * ==========================================================
 * DATE HELPERS
 * ==========================================================
 */

function startOfDay(date) {
  const result = new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}

function differenceInCalendarDays(
  futureDate,
  currentDate
) {
  const future =
    startOfDay(futureDate);

  const current =
    startOfDay(currentDate);

  const milliseconds =
    future.getTime() -
    current.getTime();

  return Math.round(
    milliseconds /
      (1000 * 60 * 60 * 24)
  );
}

function reminderDateKey(date) {
  const d = startOfDay(date);

  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    )
  );
}

/*
 * ==========================================================
 * MESSAGE BUILDERS
 * ==========================================================
 */

function getMembershipMessage(
  member,
  gym,
  daysRemaining
) {
  const gymName =
    gym.name || "your gym";

  const memberName =
    member.name || "there";

  if (daysRemaining === 7) {
    return `Hi ${memberName} 👋

Your membership at ${gymName} expires in 7 days.

Renew now to continue your training without interruption. 💪`;
  }

  if (daysRemaining === 3) {
    return `Hi ${memberName} 👋

Your membership at ${gymName} expires in 3 days.

Don't let your fitness routine stop. Renew your membership and keep training! 💪`;
  }

  if (daysRemaining === 1) {
    return `Hi ${memberName} 👋

Just a reminder that your membership at ${gymName} expires tomorrow.

Please renew to continue your training without interruption. 💪`;
  }

  return `Hi ${memberName} 👋

Your membership at ${gymName} expires today.

Please renew your membership to continue training. 💪`;
}

function getExpiredMessage(
  member,
  gym
) {
  const gymName =
    gym.name || "your gym";

  const memberName =
    member.name || "there";

  return `Hi ${memberName} 👋

Your membership at ${gymName} has expired.

We'd love to have you continue your fitness journey with us. Please contact us to renew your membership. 💪`;
}

function getPaymentDueMessage(
  member,
  gym,
  payment,
  daysUntilDue
) {
  const gymName =
    gym.name || "your gym";

  const memberName =
    member.name || "there";

  const amount =
    Number(
      payment.amount || 0
    ).toLocaleString();

  if (daysUntilDue > 0) {
    return `Hi ${memberName} 👋

This is a friendly reminder from ${gymName}.

Your payment of PKR ${amount} is due in ${daysUntilDue} days.

Please make your payment by the due date. 💳`;
  }

  return `Hi ${memberName} 👋

This is a friendly payment reminder from ${gymName}.

Your payment of PKR ${amount} is due today.

Please make your payment when convenient. 💳`;
}

function getPaymentOverdueMessage(
  member,
  gym,
  payment,
  daysOverdue
) {
  const gymName =
    gym.name || "your gym";

  const memberName =
    member.name || "there";

  const amount =
    Number(
      payment.amount || 0
    ).toLocaleString();

  return `Hi ${memberName} 👋

This is a friendly reminder from ${gymName}.

Your payment of PKR ${amount} is ${daysOverdue} day${
    daysOverdue === 1 ? "" : "s"
  } overdue.

Please contact us if you need any assistance. 💳`;
}

/*
 * ==========================================================
 * DUPLICATE PROTECTION
 * ==========================================================
 */

async function alreadyProcessed(
  gymId,
  memberId,
  type,
  scheduledDate,
  paymentId = null
) {
  const query = {
    gym: gymId,
    member: memberId,
    type,
    scheduledDate,
    status: "sent",
  };

  if (paymentId) {
    query.payment = paymentId;
  }

  const existing =
    await WhatsAppAutomationLog.findOne(
      query
    ).lean();

  return Boolean(existing);
}

/*
 * ==========================================================
 * CREATE AUTOMATION LOG
 * ==========================================================
 */

async function createLog({
  gym,
  member,
  type,
  payment = null,
  scheduledDate,
  status,
  phone,
  message,
  messageId = null,
  error = "",
}) {
  try {
    return await WhatsAppAutomationLog.create({
      gym,
      member,
      type,
      payment,
      scheduledDate,
      status,
      phone,
      message,
      messageId,
      error,
      sentAt:
        status === "sent"
          ? new Date()
          : null,
    });
  } catch (error) {
    if (error?.code === 11000) {
      console.log(
        `ℹ️ Automation log already exists: ${type}`
      );

      return null;
    }

    throw error;
  }
}

/*
 * ==========================================================
 * SEND AUTOMATION
 * ==========================================================
 */

async function sendAutomation({
  gym,
  member,
  type,
  message,
  scheduledDate,
  payment = null,
}) {
  console.log(
    `\n📨 Preparing automation: ${type}`
  );

  console.log("Member:", member.name);
  console.log("Phone:", member.phone);
  console.log(
    "Payment:",
    payment?._id || "N/A"
  );

  if (!member.phone?.trim()) {
    console.log(
      "❌ Automation stopped: member has no phone number."
    );

    await createLog({
      gym: gym._id,
      member: member._id,
      type,
      payment:
        payment?._id || null,
      scheduledDate,
      status: "failed",
      phone: "",
      message,
      error:
        "Member does not have a phone number.",
    });

    return;
  }

  const alreadySent =
    await alreadyProcessed(
      gym._id,
      member._id,
      type,
      scheduledDate,
      payment?._id || null
    );

  if (alreadySent) {
    console.log(
      `⏭️ Automation already sent today: ${type} → ${member.name}`
    );

    return;
  }

  const whatsappStatus =
    getWhatsAppStatus(gym._id);

  console.log(
    "📱 WhatsApp status:",
    whatsappStatus
  );

  if (!whatsappStatus.connected) {
    console.log(
      "❌ Automation stopped: WhatsApp is not connected."
    );

    return;
  }

  try {
    console.log(
      `📤 Sending WhatsApp message to ${member.phone}...`
    );

    const result =
      await sendWhatsAppMessage(
        gym._id,
        member.phone,
        message
      );

    console.log(
      "✅ WhatsApp send result:",
      result
    );

    await createLog({
      gym: gym._id,
      member: member._id,
      type,
      payment:
        payment?._id || null,
      scheduledDate,
      status: "sent",
      phone: result.phone,
      message,
      messageId:
        result.messageId,
    });

    console.log(
      `📨 WhatsApp automation sent: ${type} → ${member.name}`
    );
  } catch (error) {
    console.error(
      `❌ WhatsApp automation failed for ${member.name}:`,
      error.message
    );

    try {
      await createLog({
        gym: gym._id,
        member: member._id,
        type,
        payment:
          payment?._id || null,
        scheduledDate,
        status: "failed",
        phone: member.phone,
        message,
        error:
          error.message ||
          "Failed to send WhatsApp message.",
      });
    } catch (logError) {
      console.error(
        "❌ Failed to create WhatsApp automation error log:",
        logError
      );
    }
  }
}

/*
 * ==========================================================
 * MEMBERSHIP AUTOMATION
 * ==========================================================
 */

async function processMembershipReminders(
  gym,
  settings
) {
  console.log(
    `👥 Checking membership automations for: ${gym.name}`
  );

  const today =
    startOfDay(new Date());

  const members =
    await Member.find({
      gym: gym._id,

      phone: {
        $exists: true,
        $ne: "",
      },

      membershipEnd: {
        $exists: true,
        $ne: null,
      },

      status: {
        $in: [
          "Active",
          "Expired",
        ],
      },
    })
      .populate(
        "membershipPlan",
        "name duration price"
      )
      .lean();

  console.log(
    `👥 Found ${members.length} members eligible for membership automation.`
  );

  for (const member of members) {
    const membershipEnd =
      new Date(
        member.membershipEnd
      );

    const daysRemaining =
      differenceInCalendarDays(
        membershipEnd,
        today
      );

    console.log(
      `📅 ${member.name}: membership expires in ${daysRemaining} day(s).`
    );

    const config =
      REMINDER_CONFIG.find(
        (item) =>
          item.daysBeforeExpiry ===
          daysRemaining
      );

    if (config) {
      let enabled = false;

      if (
        config.type ===
        "membership_7_days"
      ) {
        enabled =
          settings.membership
            ?.sevenDays ?? true;
      }

      if (
        config.type ===
        "membership_3_days"
      ) {
        enabled =
          settings.membership
            ?.threeDays ?? true;
      }

      if (
        config.type ===
        "membership_1_day"
      ) {
        enabled =
          settings.membership
            ?.oneDay ?? true;
      }

      if (
        config.type ===
        "membership_today"
      ) {
        enabled =
          settings.membership
            ?.expiryDay ?? true;
      }

      if (enabled) {
        const message =
          getMembershipMessage(
            member,
            gym,
            daysRemaining
          );

        await sendAutomation({
          gym,
          member,
          type: config.type,
          message,
          scheduledDate:
            reminderDateKey(today),
        });
      }
    }

    if (
      settings.membership
        ?.afterExpiry !== false &&
      daysRemaining < 0 &&
      daysRemaining >= -7
    ) {
      const scheduledDate =
        reminderDateKey(today);

      const message =
        getExpiredMessage(
          member,
          gym
        );

      await sendAutomation({
        gym,
        member,
        type:
          "membership_expired",
        message,
        scheduledDate,
      });
    }
  }
}

/*
 * ==========================================================
 * PAYMENT AUTOMATION
 * ==========================================================
 */

async function processPaymentReminders(
  gym,
  settings
) {
  console.log(
    `\n💳 Checking payment automations for: ${gym.name}`
  );

  const today =
    startOfDay(new Date());

  console.log(
    "🕐 Automation date:",
    today.toString()
  );

  const payments =
    await Payment.find({
      gym: gym._id,

      status: {
        $in: [
          "Pending",
          "Partial",
        ],
      },

      dueDate: {
        $exists: true,
        $ne: null,
      },
    })
      .populate(
        "member",
        "name phone status"
      )
      .lean();

  console.log(
    `💳 Found ${payments.length} pending/partial payments.`
  );

  for (const payment of payments) {
    console.log(
      "\n----------------------------------------"
    );

    console.log(
      "🔎 Payment check:",
      {
        paymentId:
          payment._id,
        member:
          payment.member?.name,
        phone:
          payment.member?.phone,
        status:
          payment.status,
        amount:
          payment.amount,
        dueDate:
          payment.dueDate,
      }
    );

    if (!payment.member) {
      console.log(
        "⏭️ Skipping payment: member not found."
      );

      continue;
    }

    if (
      !payment.member.phone?.trim()
    ) {
      console.log(
        "⏭️ Skipping payment: member has no phone."
      );

      continue;
    }

    if (
      ![
        "Active",
        "Expired",
      ].includes(
        payment.member.status
      )
    ) {
      console.log(
        `⏭️ Skipping payment: member status is ${payment.member.status}.`
      );

      continue;
    }

    const dueDate =
      startOfDay(
        new Date(
          payment.dueDate
        )
      );

    const daysUntilDue =
      differenceInCalendarDays(
        dueDate,
        today
      );

    console.log(
      "📅 Payment date calculation:",
      {
        today:
          today.toISOString(),
        dueDate:
          dueDate.toISOString(),
        daysUntilDue,
      }
    );

    /*
     * ================================================
     * DUE TODAY
     * ================================================
     */

    if (daysUntilDue === 0) {
      console.log(
        `🟡 PAYMENT DUE TODAY: ${payment.member.name}`
      );

      if (
        settings.payments?.due !== false
      ) {
        const message =
          getPaymentDueMessage(
            payment.member,
            gym,
            payment,
            0
          );

        await sendAutomation({
          gym,
          member:
            payment.member,
          type:
            "payment_due",
          payment,
          message,
          scheduledDate:
            reminderDateKey(today),
        });
      } else {
        console.log(
          "⏭️ Payment due automation is disabled."
        );
      }

      continue;
    }

    /*
     * ================================================
     * OVERDUE
     * ================================================
     */

    if (daysUntilDue < 0) {
      const daysOverdue =
        Math.abs(
          daysUntilDue
        );

      console.log(
        `⚠️ OVERDUE PAYMENT FOUND: ${payment.member.name} — ${daysOverdue} day(s) overdue`
      );

      /*
       * First overdue reminder
       * Sends exactly 1 day after due date.
       */

      if (daysOverdue === 1) {
        console.log(
          "🔔 Processing first overdue reminder..."
        );

        if (
          settings.payments
            ?.overdue !== false
        ) {
          const message =
            getPaymentOverdueMessage(
              payment.member,
              gym,
              payment,
              daysOverdue
            );

          await sendAutomation({
            gym,
            member:
              payment.member,
            type:
              "payment_overdue",
            payment,
            message,
            scheduledDate:
              reminderDateKey(
                today
              ),
          });
        } else {
          console.log(
            "⏭️ Payment overdue automation is disabled."
          );
        }

        continue;
      }

      /*
       * ==============================================
       * REPEATED OVERDUE REMINDER
       * ==============================================
       */

      const repeatInterval =
        Number(
          settings
            .repeatOverdueDays
        ) || 1;

      const shouldSendRepeated =
        daysOverdue %
          repeatInterval ===
        0;

      console.log(
        "🔁 Repeated overdue check:",
        {
          daysOverdue,
          repeatInterval,
          shouldSendRepeated,
        }
      );

      if (
        shouldSendRepeated &&
        settings.payments
          ?.repeated !== false
      ) {
        const message =
          getPaymentOverdueMessage(
            payment.member,
            gym,
            payment,
            daysOverdue
          );

        await sendAutomation({
          gym,
          member:
            payment.member,
          type:
            "payment_repeated",
          payment,
          message,
          scheduledDate:
            reminderDateKey(
              today
            ),
        });
      } else {
        console.log(
          "⏭️ No repeated overdue reminder scheduled today."
        );
      }
    }
  }
}

/*
 * ==========================================================
 * MAIN AUTOMATION RUNNER
 * ==========================================================
 */

let automationRunning = false;

export async function runWhatsAppAutomations() {
  if (automationRunning) {
    console.log(
      "⏳ WhatsApp automation run already in progress."
    );

    return;
  }

  automationRunning = true;

  console.log(
    "\n========================================"
  );

  console.log(
    "🤖 STARTING WHATSAPP AUTOMATION RUN"
  );

  console.log(
    new Date().toString()
  );

  console.log(
    "========================================"
  );

  try {
    const gyms =
      await Gym.find({
        isActive: true,
      }).lean();

    console.log(
      `🏢 Active gyms found: ${gyms.length}`
    );

    for (const gym of gyms) {
      console.log(
        `\n🏢 Processing gym: ${gym.name}`
      );

      let settings =
        await WhatsAppAutomationSettings.findOne(
          {
            gym: gym._id,
          }
        ).lean();

      if (!settings) {
        console.log(
          "⚙️ Automation settings not found. Creating defaults..."
        );

        settings =
          await WhatsAppAutomationSettings.create(
            {
              gym: gym._id,
            }
          );

        settings =
          settings.toObject();
      }

      console.log(
        "⚙️ Automation settings:",
        {
          enabled:
            settings.enabled,
          membership:
            settings.membership,
          payments:
            settings.payments,
          repeatOverdueDays:
            settings.repeatOverdueDays,
        }
      );

      if (!settings.enabled) {
        console.log(
          "⏭️ Automation is disabled for this gym."
        );

        continue;
      }

      const status =
        getWhatsAppStatus(
          gym._id
        );

      console.log(
        "📱 Gym WhatsApp status:",
        status
      );

      if (!status.connected) {
        console.log(
          "⏭️ Skipping gym: WhatsApp is not connected."
        );

        continue;
      }

      await processMembershipReminders(
        gym,
        settings
      );

      await processPaymentReminders(
        gym,
        settings
      );
    }

    console.log(
      "\n✅ WHATSAPP AUTOMATION RUN COMPLETE"
    );
  } catch (error) {
    console.error(
      "❌ WhatsApp automation runner error:",
      error
    );
  } finally {
    automationRunning = false;
  }
}

/*
 * ==========================================================
 * START SCHEDULER
 * ==========================================================
 */

let automationInterval = null;

export function startWhatsAppAutomationScheduler() {
  if (automationInterval) {
    console.log(
      "ℹ️ WhatsApp automation scheduler is already running."
    );

    return;
  }

  console.log(
    "🤖 WhatsApp automation scheduler started."
  );

  console.log(
    `⏱️ Automation interval: ${AUTOMATION_INTERVAL / 1000} seconds`
  );

  /*
   * Initial test/run after 10 seconds.
   */

  setTimeout(() => {
    console.log(
      "\n🚀 Running initial WhatsApp automation check..."
    );

    runWhatsAppAutomations().catch(
      (error) => {
        console.error(
          "❌ Initial WhatsApp automation error:",
          error
        );
      }
    );
  }, 10000);

  /*
   * Run every 5 seconds.
   */

  automationInterval =
    setInterval(() => {
      console.log(
        "\n⏰ 5-second automation interval triggered."
      );

      runWhatsAppAutomations().catch(
        (error) => {
          console.error(
            "❌ Scheduled WhatsApp automation error:",
            error
          );
        }
      );
    }, AUTOMATION_INTERVAL);
}