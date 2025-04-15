"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ArtistLink extends Model {
    static associate(models) {
      // Association with ArtistProfile
      ArtistLink.belongsTo(models.ArtistProfile, {
        foreignKey: "artistProfileId",
        as: "artistProfile",
      });
    }
  }

  ArtistLink.init(
    {
      artistProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "ArtistProfiles",
          key: "id",
        },
      },
      platform: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          isUrl: true,
        },
      },
    },
    {
      sequelize,
      modelName: "ArtistLink",
    }
  );

  return ArtistLink;
};
