require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// User Model Login
const User = require("./models/user-model");
const NameDescription = require("./models/description-model");
const UlasanRating = require("./models/ulasan_rating-model");
const TempatWisata = require("./models/tempat_wisata-model");
// const User = require("./models/favourite-model");

const { authenticateToken } = require("./utilities");

// Koneksi ke database
mongoose.connect(config.connectionString);

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Buat Akun(Sign In)
app.post("/create-account", async (req, res) => {
  //return res.status(200).json({message:"hello"});
  const { fullName, PhoneNum, email, password } = req.body;

  if (!fullName || !PhoneNum || !email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  const isUser = await User.findOne({ email });
  if (isUser) {
    return res
      .status(400)
      .json({ error: true, message: "User Sudah Digunakan" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    fullName,
    PhoneNum,
    email,
    password: hashedPassword,
  });

  await user.save();

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "80h",
    }
  );

  return res.status(201).json({
    error: false,
    user: {
      fullName: user.fullName,
      PhoneNum: user.PhoneNum,
      email: user.email,
    },
    accessToken,
    message: "Registrasi Berhasil!!",
  });
});

// Bagian Log In
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email dan Password are Required!" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User atau Password Tidak Valid!" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "User atau Password Tidak Valid!" });
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "80h",
    }
  );

  return res.json({
    error: false,
    message: "Log-In Berhasil!",
    user: { fullName: user.fullName, email: user.email },
    accessToken,
  });
});

// Bagian GET user
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const isUser = await User.findOne({ _id: userId });

  if (!isUser) {
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
    return res
      .status(400)
      .json({ error: true, message: "All fields are required!" });
  }

  try {
    // Memeriksa apakah destinationName sudah ada di database
    const existingDestination = await NameDescription.findOne({
      destinationName,
    });
    if (existingDestination) {
      return res
        .status(400)
        .json({ error: true, message: "Nama Destinasi Sudah Ada" });
    }

    // Menyimpan data baru
    const nameDescription = new NameDescription({
      imageUrl,
      destinationName,
      description,
      userId, // Menyimpan userId sebagai pemilik data jika diperlukan
    });
    await nameDescription.save();

    res
      .status(201)
      .json({ description: nameDescription, message: "Berhasil Ditambahkan" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Bagian Ulasan dan Rating Tempat Wisata
app.post(
  "/rute-peta/add-rating-ulasan",
  authenticateToken,
  async (req, res) => {
    const { UserName, Ulasan, Rating } = req.body;
    const { userId } = req.user;

    if (!UserName || !Ulasan || !Rating) {
      return res
        .status(400)
        .json({ error: true, message: "All fields are required!" });
    }

    // Supaya Tidak Terjasi Spam Ulasan yang sama Oleh User yang sama
    try {
      // Memeriksa apakah destinationName sudah ada di database
      const existingUlasan = await UlasanRating.findOne({ UserName });
      if (existingUlasan) {
        return res
          .status(400)
          .json({ error: true, message: "Anda Sudah Memberikan Ulsan ini!" });
      }
      // Menyimpan data baru
      const ulasanRating = new UlasanRating({
        UserName,
        Ulasan,
        Rating,
        userId, // Menyimpan userId sebagai pemilik data jika diperlukan
      });
      await ulasanRating.save();
      res.status(201).json({
        description: ulasanRating,
        message: "Ulasan dan Rating Berhasil Ditambahkan!",
      });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

// Menambahkan Tempat Wisata
app.post("/add-tempat-wisata", authenticateToken, async (req, res) => {
  const { imageUrl, namaTempat, alamat, jamOperasi } = req.body;
  //   const { userId } = req.user;

  if (!imageUrl || !namaTempat || !alamat || !jamOperasi) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required!" });
  }
  try {
    // Memeriksa apakah destinationName sudah ada di database
    const existingTempatWisata = await TempatWisata.findOne({ namaTempat });
    if (existingTempatWisata) {
      return res
        .status(400)
        .json({ error: true, message: "Nama Destinasi Sudah Ada" });
    }
    //const parsedJamOperasi = new Date(parseInt(jamOperasi));

    // Menyimpan data baru
    const tempatWisata = new TempatWisata({
      imageUrl,
      namaTempat,
      alamat,
      jamOperasi,
    });
    await tempatWisata.save();

    res.status(201).json({ message: "Berhasil Ditambahkan", tempatWisata });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// GET All Tempat Wisata
app.get("/tempat-wisata", authenticateToken, async (req, res) => {
  try {
    // Ambil semua tempat wisata dari database
    const tempatWisata = await TempatWisata.find();

    // Jika tidak ada data
    if (!tempatWisata || tempatWisata.length === 0) {
      return res
        .status(404)
        .json({ error: true, message: "Tidak ada tempat wisata ditemukan." });
    }

    // Kirim respons dengan daftar tempat wisata
    res.status(200).json({
      success: true,
      message: "Daftar tempat wisata berhasil diambil.",
      data: tempatWisata,
    });
  } catch (error) {
    // Tangani error
    res.status(500).json({ error: true, message: error.message });
  }
});


// POST Tempat Wisata Favourite
app.post("/add-favorite", authenticateToken, async (req, res) => {
  const { tempatWisataId } = req.body;
  const { userId } = req.user;

  try {
    // Pastikan tempat wisata ada
    const tempatWisata = await TempatWisata.findById(tempatWisataId);
    if (!tempatWisata) {
      return res.status(404).json({ error: true, message: "Tempat wisata tidak ditemukan" });
    }

    // Cari pengguna
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: true, message: "Pengguna tidak ditemukan" });
    }

    // Pastikan favorit terinisialisasi
    if (!Array.isArray(user.favorit)) {
      user.favorit = [];
    }

    // Cek apakah tempat wisata sudah ada di daftar favorit
    if (user.favorit.includes(tempatWisataId)) {
      return res.status(400).json({ error: true, message: "Destinasi sudah ada di daftar favorit" });
    }

    // Tambahkan ke favorit
    user.favorit.push(tempatWisataId);
    await user.save();

    res.status(200).json({ success: true, message: "Destinasi berhasil ditambahkan ke favorit" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Melihat Destinasi Favourite
app.get("/favorites", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  try {
    // Temukan pengguna dan populate data favorit
    const user = await User.findById(userId).populate("favorit");
    if (!user) {
      return res.status(404).json({ error: true, message: "Pengguna tidak ditemukan" });
    }

    res.status(200).json({
      success: true,
      favorites: user.favorit, // Daftar favorit sudah terisi data lengkap
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Delete Destinasi Favourite
app.delete("/remove-favorite", authenticateToken, async (req, res) => {
  const { tempatWisataId } = req.body;
  const { userId } = req.user;

  try {
    // Cari pengguna
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: true, message: "Pengguna tidak ditemukan" });
    }

    // Hapus destinasi dari daftar favorit
    user.favorit = user.favorit.filter((id) => id.toString() !== tempatWisataId);
    await user.save();

    res.status(200).json({ success: true, message: "Destinasi berhasil dihapus dari favorit" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.listen(2000);
module.exports = app;
