import Product from "../models/marketplace.model.js";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import stripe from "../stripe/stripeInit.js";

export const sellItem = async (req, res) => {
    try {
        const {
            product_name,
            image_url,
            seller,
            seller_name,
            seller_type,
            price
        } = req.body;

        const newProduct = new Product({
            product_name,
            image_url,
            seller,
            seller_name,
            seller_type,
            price: Number(price)
        });

        if (newProduct) {
            const savedProduct = await newProduct.save();
            res.status(201).json(savedProduct);
        } else {
            res.status(400).json({ error: "Invalid product data" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAllItems = async (req, res) => {
    try {
        const loggedInUser = req.params.id;
        const products = await Product.find({ seller: { $ne: loggedInUser } });

        res.status(200).json(products);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMySellings = async (req, res) => {
    try {
        const loggedInUser = req.params.id;
        const products = await Product.find({ seller: loggedInUser });

        res.status(200).json(products);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getItemById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(400).json({ error: "Cannot get product" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const buyItem = async (req, res) => {
    try {
        const { order_id, session_id, user_id } = req.body;
        const product = await Product.findById(order_id);

        if (!product) {
            return res.status(400).json({ error: "Product not found" });
        }

        let paymentData = null;

        if (stripe && session_id && !String(session_id).startsWith("local_session_")) {
            const session = await stripe.checkout.sessions.retrieve(session_id, {
                expand: ['payment_intent.payment_method']
            });
            if (session) {
                paymentData = {
                    product_id: order_id,
                    payment_intent_id: session.payment_intent.id,
                    product_name: product.product_name,
                    image_url: product.image_url,
                    seller: product.seller,
                    seller_name: product.seller_name,
                    seller_type: product.seller_type,
                    amount: session.payment_intent.amount / 100,
                    customer_name: session.customer_details.name,
                    customer_email: session.customer_details.email,
                    customer_mobile: session.customer_details.phone,
                    delivery: `${session.payment_intent.shipping.address.line1}, ${session.payment_intent.shipping.address.line2}, ${session.payment_intent.shipping.address.city} - ${session.payment_intent.shipping.address.postal_code}, ${session.payment_intent.shipping.address.state}, ${session.payment_intent.shipping.address.country}`
                };
            }
        } else {
            const customerName = req.user?.name || "Farmer User";
            const customerMobile = req.user?.phoneno || "9999999999";
            const customerEmail = `${customerName.toLowerCase().replace(/\s+/g, "")}@kisansahayak.local`;
            paymentData = {
                product_id: order_id,
                payment_intent_id: session_id || `local_pi_${Date.now()}`,
                product_name: product.product_name,
                image_url: product.image_url,
                seller: product.seller,
                seller_name: product.seller_name,
                seller_type: product.seller_type,
                amount: Number(product.price) + 46,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_mobile: customerMobile,
                delivery: "Standard Farm Delivery, India"
            };
        }

        const newPayment = new Payment(paymentData);

        let order = await Order.findOne({ user: user_id });
        if (!order) {
            order = await Order.create({ user: user_id, orders: [] });
        }
        order.orders.push(newPayment._id);

        await Promise.all([order.save(), newPayment.save()]);

        // Only remove user-listed products, keep seeded store items available or remove non-seed items
        if (!String(product._id).startsWith("6600000000000000000001")) {
            await Product.deleteOne({ _id: order_id });
        }

        return res.status(200).json({
            product_id: newPayment.product_id,
            product_name: newPayment.product_name,
            image_url: newPayment.image_url,
            seller: newPayment.seller,
            seller_name: newPayment.seller_name,
            seller_type: newPayment.seller_type,
            amount: newPayment.amount,
            customer_name: newPayment.customer_name,
            customer_email: newPayment.customer_email,
            customer_mobile: newPayment.customer_mobile,
            delivery: newPayment.delivery
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userOrders = await Order.findOne({ user: req.params.id });
        if (!userOrders) {
            return res.status(200).json([]);
        }

        const orderIds = userOrders.orders;
        const orders = await Payment.find({ _id: { $in: orderIds } });

        res.status(200).json(orders || []);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getSuggestions = async (req, res) => {
    try {
        const loggedInUser = req.params.id;
        const { keys } = req.body;
        const products = await Product.find({ seller: { $ne: loggedInUser } });

        if (!Array.isArray(keys) || keys.length === 0) {
            return res.status(200).json([]);
        }

        const filteredProducts = products.filter((product) =>
            keys.some((key) =>
                product.product_name.toLowerCase().includes(String(key).toLowerCase())
            )
        );

        res.status(200).json(filteredProducts);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};