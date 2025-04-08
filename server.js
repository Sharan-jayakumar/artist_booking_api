const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const routes = require("./routes");
const db = require("./models");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(morgan('tiny'));

// Routes
app.use("/api", routes);

// Handle 404 routes
app.use(notFound);

// Global error handling
app.use(errorHandler);

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

module.exports = app;
