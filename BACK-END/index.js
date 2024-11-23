require("dotenv").config();

const config = require("./config.json")
const mongoose = require ("mongoose")

const bcrypt = require("bcrypt")
const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken");

// User Model Login
const User = require ("./models/user-model");
const NameDescription = require ("./models/description-model");
const UlasanRating = require ("./models/ulasan_rating-model");
const { authenticateToken } = require("./utilities");

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
        return res.status(400).json ({message : "User atau Password Tidak Valid!"})
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid){
        return res.status(400).json({message: "User atau Password Tidak Valid!"})
    }

    const accessToken = jwt.sign(
        {userId:user._id},
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "80h",
        }
    );

    return res.json({
        error : false,
        message : "Log-In Berhasil!",
        user : {fullName:user.fullName, email:user.email},
        accessToken,
    });


});

// Bagian GET user
app.get("/get-user", authenticateToken, async (req,res) =>{
    const {userId} = req.user;
    const isUser = await User.findOne({_id:userId});

    if(!isUser){
        return res.sendStatus(401);
    }
    return res.json({
        user: isUser,
        message: " ",

    });
});

// Bagian Deskripsi Tempat Wisata
app.post("/rute-peta/add-description", authenticateToken, async (req, res) => {
    const { destinationName, description, imageUrl } = req.body;
    const { userId } = req.user;

    // Validasi data input
    if (!destinationName || !description || !imageUrl) {
        return res.status(400).json({ error: true, message: "All fields are required!" });
    }

    try {
        // Memeriksa apakah destinationName sudah ada di database
        const existingDestination = await NameDescription.findOne({ destinationName });
        if (existingDestination) {
            return res.status(400).json({ error: true, message: "Nama Destinasi Sudah Ada" });
        }

        // Menyimpan data baru
        const nameDescription = new NameDescription({
            imageUrl,
            destinationName,
            description,
            userId, // Menyimpan userId sebagai pemilik data jika diperlukan
        });
        await nameDescription.save();

        res.status(201).json({ description: nameDescription, message: "Berhasil Ditambahkan" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Bagian Ulasan dan Rating Tempat Wisata
app.post("/rute-peta/add-rating-ulasan", authenticateToken, async (req, res) =>{
    const { UserName, Ulasan, Rating } = req.body;
    const { userId } = req.user;

    if (!UserName || !Ulasan || !Rating) {
        return res.status(400).json({ error: true, message: "All fields are required!" });
    }

    // Supaya Tidak Terjasi Spam Ulasan yang sama Oleh User yang sama
    try {
    // Memeriksa apakah destinationName sudah ada di database
    const existingUlasan = await UlasanRating.findOne({ UserName });
    if (existingUlasan) {
        return res.status(400).json({ error: true, message: "Anda Sudah Memberikan Ulsan ini!" });
    }
    // Menyimpan data baru
    const ulasanRating = new UlasanRating({
        UserName,
        Ulasan,
        Rating,
        userId, // Menyimpan userId sebagai pemilik data jika diperlukan
        });
    await ulasanRating.save();
    res.status(201).json({ description: ulasanRating, message: "Ulasan dan Rating Berhasil Ditambahkan!" });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Bagian Lihat Semua Tempat Wisata
app.post("/tempat-wisata", authenticateToken, async (req, res) =>{
    

});

app.listen(2000);
module.exports = app;