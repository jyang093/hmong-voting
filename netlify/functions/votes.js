const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

let votes = {};

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(votes)
    };
  }

  if (event.httpMethod === "POST") {
    const sig = event.headers["stripe-signature"];
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
      // You'll map this to contestant IDs later
      // For now it just logs the amount
      console.log("Payment received:", session.amount_total);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
