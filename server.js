import axios from "axios";
import express from "express";
import mongoose from "mongoose";
import Order from "/orderModel.js";
import Payment from "/paymentModel.js";
import cors from "cors";
import crypto from "crypto";  //builtin module nodejs mein



const merchent = "" //merchentId
const merchentApiKey = ""
const cryptomusUri = "" //example: https://api.cryptomus.com/v1
const serverUri = ""
const clientUri = ""

const mongoUri = "mogodb://url/database_name" //connect database before testing in postman
const port = 3000;

const app = express()

app.use(express.static("public"));
app.use(cors())
app.use(express.json({
    verify: (req, _, buf) => {
        req.rawBody = buf.toString();
    }
})) //request me hame jab bhi koi hash ya hmac bhejna hoto hum ye use karte hai verify toh ye buffer ko convert karke string me store kardega raw body me

app.post("/checkout", async (req,res,next) => {
    try {
        const {product} = req.body;

        //sanitizing
        if(!product.name || !product.amount) return next(new Error("invalid product"));

        //create a new order
        const order = await Order.create({
            product: product.name,
            amount: product.amount.toString(),
        })

        //create a new payment intent

        const payload = {
            amount: product.amount,
            currency: "usd",
            order_id:order._id,
            url_callback: `${server}/paymen/success`
        };

        const bufferData = Buffer.from(JSON.stringify(payload)).toString("base64").concat(merchentApiKey);  // payload ka buffer data create kiya

        const sign = crypto.createHash("md5").update(bufferData).digest("hex") // read docs of sign in cryptomus to create

        const {data} = await axios.post(`${cryptomusUri}/payment`, payload, {
            headers: {
                merchent,
                sign,
                "Content-Type": "application/json"
            }
        })

        res.json({order}) // On first check on postman : order And checkTime in youtube: 16:34
        res.json({success: true, data}) //On second check on postman: data, message And after testing check amount in cryptomus And checktime in youtube: 22:57
        res.json({success: true, paymentLink: data?.result?.url}) //If you want to view only review
    } catch (error) {
        
    }
})

app.post("/payment/success", async (req,res) => {
    const {
        sign, order_id, uuid, payer_currency, amount, payment_amount, currency, network
    } = body; // Aise dekh lo ya phir docs se dekhlo kya hai body me    res.send('Payment Success');

    //sanitizing
    if(!sign) return next(new Error("invalid request"));

    const data = Json.parse(req.rawBody);

    delete data.sign; // ye delete kyu kiya waise as we can see payload sarri info hai par sign nahi hai isliye humne data se sign delete kiya

    const bufferData = Buffer.from(JSON.stringify(payload)).toString("base64").concat(merchentApiKey);  // payload ka buffer data create kiya    
    
    const hash = crypto.createHash("md5").update(bufferData).digest("hex");

    //sanitizing
    if(hash !== sign) return next(new Error("invalid payment"));

    const order = await Order.findById(order._id);
    
    if(!order) return next(new Error("invalid order"));

    const payment = await Payment.create({
        uuid,
        order_id,
        payer_currency,
        amount,
        currency,
        network
    }) //create payment jo database me save karenge

    order.payment_status = "paid";
    order.payment_info = payment._id

    await order.save()

    res.redirect(clientUri);

    //Now for testing check youtube video: 29:55


})

app.use((err,res,req,next) => {
    res.status(500).json({message: err.message});
})

