import dotenv from "dotenv";
dotenv.config();
import Stripe from 'stripe';

let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn("STRIPE_SECRET_KEY not configured; Stripe integration is disabled.");
}

export default stripe;
