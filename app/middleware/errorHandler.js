const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    console.error("ERROR", err);
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Production error response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error("ERROR", err);
      res.status(500).json({
        status: "error",
        message: "Something went wrong!",
      });
    }
  }
};

module.exports = errorHandler;
