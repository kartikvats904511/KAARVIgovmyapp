const app = require("./server-app");

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`KAARVI server running on port ${PORT}`);
});
