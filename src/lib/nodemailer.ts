// Cons: Gmail SMTP has sending limits (about 500/day).

import nodemailer from "nodemailer";
import { SMTP_PASS, SMTP_USER } from "./Env";

export const nodemailerTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});
