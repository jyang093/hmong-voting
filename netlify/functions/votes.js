// netlify/functions/votes.js
// Simple in-memory store for demo. For production use Netlify Blobs, Supabase, or a database.
let votes = {};

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(votes)
    };
  }

  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { contestantId, quantity } = body;
      if (contestantId) {
        votes[contestantId] = (votes[contestantId] || 0) + (Number(quantity) || 1);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, votes })
      };
    } catch (e) {
      return { statusCode: 400, body: "Bad request" };
    }
  }

  return { statusCode: 405, body: "Method not allowed" };
};
