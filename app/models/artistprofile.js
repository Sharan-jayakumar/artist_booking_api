"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ArtistProfile extends Model {
    static associate(models) {
      // Association with User
      ArtistProfile.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });

      // Association with ArtistLink
      ArtistProfile.hasMany(models.ArtistLink, {
        foreignKey: "artistProfileId",
        as: "links",
      });
    }
  }

  ArtistProfile.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      skill: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      stageName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      accountHolderName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      bsb: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 6],
        },
      },
      accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      abn: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [11, 11],
        },
      },
    },
    {
      sequelize,
      modelName: "ArtistProfile",
      hooks: {
        beforeValidate: async (profile, options) => {
          // Skip validation if the profile is being deleted
          if (options.type === "DELETE") return;

          // Get the associated user
          const user = await sequelize.models.User.findByPk(profile.userId);
          if (!user) {
            throw new Error("User not found");
          }

          // Check if user is an artist
          if (user.userType !== "artist") {
            throw new Error(
              "Only artists can create or update artist profiles"
            );
          }
        },
      },
    }
  );

  return ArtistProfile;
};
