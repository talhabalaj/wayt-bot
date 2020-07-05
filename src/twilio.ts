import twilio from "twilio";
import { config } from "dotenv";

config();

export const accountSid = process.env.TWILIO_SID || "";
export const authToken = process.env.AUTH_TOKEN || "";

export default twilio(accountSid, authToken);
