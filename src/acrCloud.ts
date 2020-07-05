import { config } from "dotenv";

const acrCloud = require("acrcloud");

config();

export const acrCloudClient = new acrCloud({
  // required
  access_key: process.env.ACRCLOUD_ACCESS_KEY,
  access_secret: process.env.ACRCLOUD_ACCESS_SECRET,
  // optional

  host: "identify-ap-southeast-1.acrcloud.com",
});
