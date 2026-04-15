"use server";

import { requireAdminUser } from "@/lib/admin";
import Stripe from "stripe";
import nodemailer from "nodemailer";

export async function testStripeConnectionAction(secretKey: string) {
  try {
    await requireAdminUser();
    
    if (!secretKey || secretKey === "********") {
      throw new Error("Cannot test using a masked key. Please enter a new key to test.");
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27-preview.acacia" as any,
    });

    await stripe.balance.retrieve();
    return { success: true, message: `Stripe connection verified. API Key is active and authorized.` };
  } catch (err: any) {
    return { success: false, message: `Stripe Validation Failed: ${err.message}` };
  }
}

export async function testEmailConnectionAction(config: {
  user: string;
  pass?: string;
  host: string;
  port: string;
  sender: string;
}) {
  try {
    await requireAdminUser();
    
    if (config.pass === "********") {
      throw new Error("Cannot test because the password is encrypted. To test, please re-enter the password.");
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port),
      secure: parseInt(config.port) === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    // Check if configuration is correct
    await transporter.verify();

    return { success: true, message: "Email configuration is valid. Server connection successful." };
  } catch (err: any) {
    return { success: false, message: `Email Validation Failed: ${err.message}` };
  }
}
