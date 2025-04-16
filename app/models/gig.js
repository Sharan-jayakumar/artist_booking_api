"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Gig extends Model {
    static associate(models) {
      Gig.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Gig.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Gig name is required",
          },
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: {
            msg: "Please provide a valid date",
          },
          notEmpty: {
            msg: "Date is required",
          },
          isFuture(value) {
            if (value && new Date(value) < new Date().setHours(0, 0, 0, 0)) {
              throw new Error("Date must be in the future");
            }
          },
        },
      },
      venue: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Venue is required",
          },
        },
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isDecimal: {
            msg: "Hourly rate must be a valid number",
          },
          min: {
            args: [0],
            msg: "Hourly rate cannot be negative",
          },
        },
      },
      fullGigAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isDecimal: {
            msg: "Full gig amount must be a valid number",
          },
          min: {
            args: [0],
            msg: "Full gig amount cannot be negative",
          },
        },
      },
      estimatedAudienceSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: {
            msg: "Estimated audience size must be a whole number",
          },
          min: {
            args: [0],
            msg: "Estimated audience size cannot be negative",
          },
        },
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: "Start time must be a valid date and time",
          },
          notEmpty: {
            msg: "Start time is required",
          },
          isFutureDateTime(value) {
            if (value && new Date(value) < new Date()) {
              throw new Error("Start time must be in the future");
            }
          },
        },
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: "End time must be a valid date and time",
          },
          notEmpty: {
            msg: "End time is required",
          },
          isAfterStartTime(value) {
            if (this.startTime && value <= this.startTime) {
              throw new Error("End time must be after start time");
            }
          },
        },
      },
      totalHours: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      equipment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      jobDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Gig",
      validate: {
        validatePaymentOption() {
          const hasHourlyRate =
            this.hourlyRate !== null && this.hourlyRate !== undefined;
          const hasFullAmount =
            this.fullGigAmount !== null && this.fullGigAmount !== undefined;

          if (!hasHourlyRate && !hasFullAmount) {
            throw new Error(
              "Either hourly rate or full gig amount must be provided"
            );
          }
          if (hasHourlyRate && hasFullAmount) {
            throw new Error(
              "Cannot provide both hourly rate and full gig amount"
            );
          }
        },
      },
      hooks: {
        beforeValidate: async (profile, options) => {

          // Get the associated user
          const user = await sequelize.models.User.findByPk(profile.userId);
          if (!user) {
            throw new Error("User not found");
          }

          // Check if user is an artist
          if (user.userType !== "venue") {
            throw new Error(
              "Only artists can create or update artist profiles"
            );
          }
        },
        beforeSave: async (gig) => {
          if (gig.startTime && gig.endTime) {
            const start = new Date(gig.startTime);
            const end = new Date(gig.endTime);

            // Ensure both dates are on the same day as the gig date
            if (gig.date) {
              const gigDate = new Date(gig.date);
              if (
                start.toDateString() !== gigDate.toDateString() ||
                end.toDateString() !== gigDate.toDateString()
              ) {
                throw new Error(
                  "Start time and end time must be on the same day as the gig date"
                );
              }
            }

            // Calculate time difference
            const diff = end.getTime() - start.getTime();

            // Convert to hours, minutes, seconds
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Format as HH:MM:SS
            gig.totalHours = `${String(hours).padStart(2, "0")}:${String(
              minutes
            ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          }
        },
      },
    }
  );

  return Gig;
};
