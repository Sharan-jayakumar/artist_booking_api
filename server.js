const app = require("./app");
const PORT = process.env.PORT || 5000;
const db = require("./app/models");
// test db connection and start server
db.sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
