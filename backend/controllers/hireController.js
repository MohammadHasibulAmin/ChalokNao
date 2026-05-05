const Hire = require("../models/Hire");
const Transaction = require("../models/Transaction");
const Contract = require("../models/Contract");
const Driver = require("../models/Driver");

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
let stripe = null;
if (stripeSecret) {
  stripe = require("stripe")(stripeSecret);
}

const COMMISSION_PERCENTAGE = 0.15; // 15% commission

exports.createHire = async (req, res) => {
  try {
    const { ownerId, driverId, salary, duration } = req.body;
    if (!ownerId || !driverId) {
      return res.status(400).json({ message: "ownerId and driverId are required" });
    }

    const hire = await Hire.createHire({
      ownerId,
      driverId,
      salary: Number(salary || 0),
      duration: duration || null,
      ownerConfirm: true,
      driverConfirm: false,
    });

    return res.status(201).json(hire);
  } catch (err) {
    console.error("CREATE HIRE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.confirmHire = async (req, res) => {
  try {
    const { actor } = req.body;
    const hire = await Hire.findById(req.params.id);

    if (!hire) {
      return res.status(404).json({ message: "Hire not found" });
    }

    const update = {};
    if (actor === "driver") update.driverConfirm = true;
    if (actor === "owner") update.ownerConfirm = true;

    const willBeBothConfirmed = (update.driverConfirm || hire.driverConfirm) && (update.ownerConfirm || hire.ownerConfirm);
    if (willBeBothConfirmed) {
      // When both parties have confirmed, set status to AwaitingPayment and create a pending transaction.
      update.status = "AwaitingPayment";

      try {
        const commission = Math.round(Number(hire.salary) * COMMISSION_PERCENTAGE * 100) / 100;
        const ownerAmount = Math.round((Number(hire.salary) - commission) * 100) / 100;

        const tx = await Transaction.createTransaction({
          hireId: String(hire._id),
          ownerId: hire.ownerId,
          driverId: hire.driverId,
          amount: Number(hire.salary),
          commission,
          ownerAmount,
          status: "pending",
          type: "hire_confirmation",
        });

        // Attach transaction id to hire for tracking
        update.transactionId = String(tx._id);
      } catch (err) {
        console.warn("Transaction creation failed:", err.message);
      }
    }

    const updated = await Hire.updateHire(req.params.id, update);
    return res.json({ hire: updated });
  } catch (err) {
    console.error("CONFIRM HIRE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Create a Stripe Checkout session (owner will be redirected to Stripe)
exports.createPaymentSession = async (req, res) => {
  if (!stripe) return res.status(500).json({ message: "Stripe not configured" });

  try {
    const hire = await Hire.findById(req.params.id);
    if (!hire) return res.status(404).json({ message: "Hire not found" });

    // Find transaction
    const txList = await Transaction.findAll ? await Transaction.findAll({ hireId: String(hire._id) }) : [];
    let tx = Array.isArray(txList) ? txList.find((t) => String(t.hireId) === String(hire._id) && t.status === "pending") : null;

    if (!tx) {
      const commission = Math.round(Number(hire.salary) * COMMISSION_PERCENTAGE * 100) / 100;
      const ownerAmount = Math.round((Number(hire.salary) - commission) * 100) / 100;
      tx = await Transaction.createTransaction({
        hireId: String(hire._id),
        ownerId: hire.ownerId,
        driverId: hire.driverId,
        amount: Number(hire.salary),
        commission,
        ownerAmount,
        status: "pending",
        type: "hire_confirmation",
      });
    }

    const successUrl = (process.env.FRONTEND_URL || "http://localhost:3000") +
      `/payment-success?hireId=${hire._id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Hire payment for driver ${hire.driverId}` },
            unit_amount: Math.round(Number(hire.salary) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { hireId: String(hire._id), transactionId: String(tx._id) },
    });

    // save session id on transaction
    await Transaction.updateTransaction(String(tx._id), { stripeSessionId: session.id });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("CREATE PAYMENT SESSION ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Finalize payment after Stripe confirms (called from frontend after redirect or by webhook)
exports.finalizePayment = async (req, res) => {
  if (!stripe) return res.status(500).json({ message: "Stripe not configured" });

  try {
    const { sessionId, hireId } = req.body;
    if (!sessionId && !hireId) return res.status(400).json({ message: "sessionId or hireId required" });

    let session = null;
    if (sessionId) {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } else if (hireId) {
      // find transaction with hireId
      const txAll = await Transaction.findAll({ hireId: String(hireId) });
      const pending = Array.isArray(txAll) ? txAll.find((t) => t.status === "pending") : null;
      if (!pending || !pending.stripeSessionId) return res.status(400).json({ message: "No pending stripe session found" });
      session = await stripe.checkout.sessions.retrieve(pending.stripeSessionId);
    }

    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const meta = session.metadata || {};
    const txId = meta.transactionId;
    const hireIdMeta = meta.hireId || hireId;

    // mark transaction completed
    if (txId) {
      await Transaction.updateTransaction(txId, { status: "completed", stripeSessionId: session.id });
    } else if (hireIdMeta) {
      const txAll = await Transaction.findAll({ hireId: String(hireIdMeta) });
      const pend = Array.isArray(txAll) ? txAll.find((t) => t.status === "pending") : null;
      if (pend) await Transaction.updateTransaction(String(pend._id), { status: "completed", stripeSessionId: session.id });
    }

    // finalize hire, create contract and add employment history
    const hire = await Hire.findById(hireIdMeta);
    if (hire) {
      await Hire.updateHire(hireIdMeta, { status: "Confirmed", updatedAt: new Date() });

      // create contract record
      try {
        await Contract.createContract({
          hireId: String(hire._id),
          ownerId: hire.ownerId,
          driverId: hire.driverId,
          salary: Number(hire.salary),
          duration: hire.duration || null,
          paymentStatus: "paid",
        });
      } catch (err) {
        console.warn("Contract create failed:", err.message);
      }

      // add employment history to driver
      try {
        await Driver.addEmploymentEntry(hire.driverId, {
          hireId: String(hire._id),
          ownerId: hire.ownerId,
          salary: Number(hire.salary),
          duration: hire.duration || null,
          startedAt: new Date(),
        });
      } catch (err) {
        console.warn("Driver employment update failed:", err.message);
      }
    }

    return res.json({ message: "Payment finalized and hire confirmed" });
  } catch (err) {
    console.error("FINALIZE PAYMENT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getHireStatus = async (req, res) => {
  try {
    const hire = await Hire.findById(req.params.id);
    if (!hire) {
      return res.status(404).json({ message: "Hire not found" });
    }
    return res.json(hire);
  } catch (err) {
    console.error("GET HIRE STATUS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getOwnerHires = async (req, res) => {
  try {
    const hires = await Hire.listByOwner(req.params.ownerId);
    return res.json(hires);
  } catch (err) {
    console.error("GET OWNER HIRES ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

async function finalizeSession(session) {
  try {
    const meta = session.metadata || {};
    const txId = meta.transactionId;
    const hireIdMeta = meta.hireId;

    if (txId) {
      await Transaction.updateTransaction(txId, { status: "completed", stripeSessionId: session.id });
    } else if (hireIdMeta) {
      const txAll = await Transaction.findAll({ hireId: String(hireIdMeta) });
      const pend = Array.isArray(txAll) ? txAll.find((t) => t.status === "pending") : null;
      if (pend) await Transaction.updateTransaction(String(pend._id), { status: "completed", stripeSessionId: session.id });
    }

    const hire = await Hire.findById(hireIdMeta);
    if (hire) {
      await Hire.updateHire(hireIdMeta, { status: "Confirmed", updatedAt: new Date() });

      try {
        await Contract.createContract({
          hireId: String(hire._id),
          ownerId: hire.ownerId,
          driverId: hire.driverId,
          salary: Number(hire.salary),
          duration: hire.duration || null,
          paymentStatus: "paid",
        });
      } catch (err) {
        console.warn("Contract create failed:", err.message);
      }

      try {
        await Driver.addEmploymentEntry(hire.driverId, {
          hireId: String(hire._id),
          ownerId: hire.ownerId,
          salary: Number(hire.salary),
          duration: hire.duration || null,
          startedAt: new Date(),
        });
      } catch (err) {
        console.warn("Driver employment update failed:", err.message);
      }
    }
  } catch (err) {
    console.error("finalizeSession error:", err);
    throw err;
  }
}

exports.webhookHandler = async (req, res) => {
  if (!stripe) return res.status(500).send("Stripe not configured");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  try {
    let event;
    if (webhookSecret) {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await finalizeSession(session);
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    res.status(400).send(`Webhook error: ${err.message}`);
  }
};