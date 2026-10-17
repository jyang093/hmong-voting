const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { getStore } = require("@netlify/blobs");

const STORE_NAME = "votes";

async function getVotes() {
  const store = getStore(STORE_NAME);
  const data = await store.get("totals", { type: "json" });
  return data || { spongebob: 0, patrick: 0, squidward: 0 };
}

async function saveVotes(votes) {
  const store = getStore(STORE_NAME);
  await store.setJSON("totals", votes);
}

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    const votes = await getVotes();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(votes)
    };
  }

  if (event.httpMethod === "POST") {
    const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;
      const linkMap = {
        "plink_1URMC5B545EsmqP6lJEk5kAD": "spongebob"
        // add the other plink_ IDs here
      };

      const contestantId = linkMap[session.payment_link];
      const quantity = session.amount_total ? Math.round(session.amount_total / 500) : 1;

      if (contestantId) {
        const votes = await getVotes();
        votes[contestantId] = (votes[contestantId] || 0) + quantity;
        await saveVotes(votes);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
