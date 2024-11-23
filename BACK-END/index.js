require("dotenv").config();

const config = require("./config.json")
const mongoose = require ("mongoose")

const bcrypt = require("bcrypt")
const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken");

// User Model Login
const User = require ("./models/user-model");

// Koneksi ke database
mongoose.connect(config.connectionString)

const app =express()
app.use(express.json());
app.use(cors({origin: "*"}))

// Buat Akun(Sign In)
app.post("/create-account", async (req,res) =>{
    //return res.status(200).json({message:"hello"});
    const {fullName, PhoneNum,email, password} = req.body;

    if(!fullName ||!PhoneNum || !email || !password){
        return res
        .status(400)
        .json ({ error : true, message : "All fields are required"});
    }

    const isUser = await User.findOne({email});
    if (isUser){
        return res
        .status(400)
        .json({error: true, message:"User Sudah Digunakan"})
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
        fullName,
        PhoneNum,
        email,
        password : hashedPassword,
    });

    await user.save();

    const accessToken = jwt.sign(
        {userId: user._id},
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "80h",
        });


    return res.status(201).json({
        error:false,
        user:{fullName:user.fullName,PhoneNum:user.PhoneNum, email:user.email},
        accessToken,
        message : "Registrasi Berhasil!!",
    })
});

// Bagian Log In
app.post("/login", async (req,res) =>{

    const {email, password} = req.body;

    if (!email || !password){
        return res.status(400).json ({message : "Email dan Password are Required!"})
    }

    const user = await User.findOne ({email})
    if (!user){
        return res.status(400).json ({message : "User Tidak Ditemukan!"})
    }


});

app.listen(2000);
module.exports = app;