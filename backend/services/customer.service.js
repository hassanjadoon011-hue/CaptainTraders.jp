const Customer = require("../models/Customer");

const clean = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Find the CRM record for this email, or create it.
 * Never overwrites what is already stored; only fills empty fields.
 * Returns the customer, or null when there is no usable email.
 */
const upsertFromContact = async (contact = {}, source = "inquiry", at = new Date()) => {
  const email = clean(contact.email, 200).toLowerCase();
  if (!email) return null;

  const fields = {
    name: clean(contact.name, 80),
    phone: clean(contact.tel || contact.phone, 25),
    country: clean(contact.country, 60),
    city: clean(contact.city, 80),
    address: clean(contact.address, 200),
    deliveryPort: clean(contact.deliveryPlace || contact.deliveryPort, 100),
  };

  const existing = await Customer.findOne({ email });
  if (!existing) {
    try {
      return await Customer.create({
        ...fields,
        name: fields.name || email,
        email,
        source,
        lastContactAt: at,
      });
    } catch (err) {
      // Two requests at once: the other one created it
      if (err?.code !== 11000) throw err;
      return upsertFromContact(contact, source, at);
    }
  }

  for (const [k, v] of Object.entries(fields)) {
    if (v && !existing[k]) existing[k] = v;
  }
  if (!existing.lastContactAt || existing.lastContactAt < at) existing.lastContactAt = at;
  await existing.save();
  return existing;
};

// A paid order turns a lead into an active customer
const markActive = async (customerId) => {
  if (!customerId) return;
  await Customer.updateOne({ _id: customerId, status: "lead" }, { $set: { status: "active" } });
};

module.exports = { upsertFromContact, markActive };
