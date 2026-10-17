const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

let votes = {
  spongebob: 0,
  patrick: 0,
  squidward: 0
};

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
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
      // Map your Stripe Payment Link IDs to contestants
      // You'll replace these with the real Payment Link IDs from Stripe
      const linkMap = {
        "plink_1URH5fB545EsmqP6TD5NiGEK": "spongebob",
        "plink_1URM7LB545EsmqP6jUF72Lml": "patrick",
        "plink_1URMC5B545EsmqP6lJEk5kAD": "squidward"
      };

      const contestantId = linkMap[session.payment_link];
      const quantity = session.amount_total ? Math.round(session.amount_total / 500) : 1;

      if (contestantId && votes.hasOwnProperty(contestantId)) {
        votes[contestantId] += quantity;
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
