const express = require("express");
const app = express();
const importCountry = require("./Country.json");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const { google } = require("googleapis");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const CLIENT_ID = process.env.GOGGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const cors = require("cors");
let port = process.env.PORT || 4000;

// // app.use(bodyParser.urlencoded({ extended: true }));
// // app.use(express.json());

app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.post(
    "/login/countries",
    async (req, res) => {
        res.status(201).send(importCountry);
    }
);

app.post(
    "/login/verify",
    async (req, res) => {
        const email = req.query.email;
        const accessToken = await oAuth2Client.getAccessToken();
        const otpNumber = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            alphabets: false,
            specialChars: false,
        });

        console.log(otpNumber);

        const mailTransport = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                type: "OAuth2",
                user: "kingvidoski@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refresh_token: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const details = {
            from: "Kingsley Okon <kingvidoski@gmail.com>",
            to: email,
            subject: "Verify you new Amazon-Clone account",
            html: `
          <p>To verify your email address, please use the following One Time Password (OTP):</p>
          <h3>${otpNumber}</h3>
          <p>Do not share this OTP with anyone. Amazon takes your account security very seriously. Amazon Customer Service will never ask you to disclose or verify your Amazon password, OTP, credit card, or banking account number. If you receive a suspicious email with a link to update your account information, do not click on the link—instead, report the email to Amazon for investigation.</p>
          <p>Thank you!</p>
    `,
        };

        mailTransport.sendMail(details, (err) => {
            if (err) {
                console.log("An error Occurred", err);
            } else {
                console.log("Email sent successfully", email);
            }
        });

        res.status(201).send(otpNumber);
    }
);

app.post(
    "/payments/create",
    async (req, res) => {
        const amount = req.query.total;

        console.log("Payment Request Recieved BOM!!! for this amount >>> ", amount);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
        });

        res.status(201).send({
            clientSecret: paymentIntent.client_secret,
        });
        console.log("Client Secret >>> ", paymentIntent.client_secret);
    }
);

app.listen(port, () => {
    console.log(`App is listening on port https://localhost${port}`);
});
