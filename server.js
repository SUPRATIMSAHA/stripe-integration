const express = require("express");
const app = express();

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index", { stripePublicKey: process.env.STRIPE_PUBLIC_KEY });
});

app.post("/create-checkout-session", async (req, res) => {
  console.log(req.body);
  let line_items = [];
  for (let i = 0; i < 2; i++) {
    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: req.body.name,
        },
        unit_amount: parseInt(req.body.amount) * 100,
      },
      quantity: req.body.quantity,
    });
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: line_items,
    mode: "payment",
    success_url:
      "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:3000/cancel",
  });

  res.json({ id: session.id });
});

app.get("/success", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  const customer = await stripe.customers.retrieve(session.customer);
  res.send(
    `<html><body><h1>Thanks for your order, ${customer.name}!</h1></body></html>`
  );
});

app.listen(3000, () => console.log("server running at port 3000"));
