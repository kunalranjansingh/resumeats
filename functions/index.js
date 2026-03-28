const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.post("/analyze", async (req, res) => {
  res.json({
    score: 80,
    missing_keywords: ["Test"],
    strengths: ["Working"],
    weaknesses: [],
    suggestions: [],
    formatting_issues: []
  });
});

exports.api = functions.https.onRequest(app);