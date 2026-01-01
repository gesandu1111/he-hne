const express = require("express");
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));
app.use("/code", require("./pair"));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`⏩ Server running on http://localhost:${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("Caught exception:", err);
});
