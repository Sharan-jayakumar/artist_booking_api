const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const routes = require("./routes");

const app = express();

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

module.exports = app;


