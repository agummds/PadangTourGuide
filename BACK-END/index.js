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
const EventLokal = require("./models/event-model");
const Favourite = require("./models/favourite-model");

// const User = require("./models/favourite-model");

const { authenticateToken, authorizeAdmin } = require("./utilities");

// Koneksi ke database
mongoose.connect(config.connectionString);

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Bagian Khusus Admin
// Create Account Admin
app.post("/create-admin", async (req, res) => {
  const { fullName, PhoneNum, email, password, role } = req.body;

  // Cek apakah sudah ada admin di database
  const adminExist = await User.findOne({ role: "admin" });

  // Jika belum ada admin, izinkan pembuatan admin pertama tanpa autentikasi
  if (!adminExist) {
    if (!fullName || !PhoneNum || !email || !password) {
      return res
        .status(400)
        .json({ error: true, message: "Semua kolom wajib diisi." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      fullName,
      PhoneNum,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    return res
      .status(201)
      .json({ error: false, message: "Admin pertama berhasil dibuat!", admin });
  }

  // Proses normal untuk pembuatan admin, hanya admin yang sudah login dapat mengakses
  const { userId } = req.user;

  const currentUser = await User.findById(userId);
  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({
      error: true,
      message: "Akses ditolak. Hanya admin yang dapat membuat akun admin.",
    });
  }

  if (!fullName || !PhoneNum || !email || !password || !role) {
    return res
      .status(400)
      .json({ error: true, message: "Semua kolom wajib diisi." });
  }

  const isUser = await User.findOne({ email });
  if (isUser) {
    return res
      .status(400)
      .json({ error: true, message: "Email sudah digunakan." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new User({
    fullName,
    PhoneNum,
    email,
    password: hashedPassword,
    role: "admin",
  });

  await admin.save();
  res
    .status(201)
    .json({ error: false, message: "Akun Admin berhasil dibuat!", admin });
});

// Bagian Admin Log-In
app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  // Validasi input
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan Password harus diisi!" });
  }

  try {
    // Cari user berdasarkan email
    const user = await User.findOne({ email });

    // Cek apakah user ada dan merupakan admin
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Akses ditolak. Bukan akun admin!" });
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Email atau password salah!" });
    }

    // Buat access token khusus admin
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role }, // Tambahkan role ke payload
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "80h" }
    );

    res.status(200).json({
      success: true,
      message: "Login admin berhasil!",
      admin: { fullName: user.fullName, email: user.email },
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Buat Akun User(Sign In)
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
    role: "user", // Untuk Default role
  });

  await user.save();

  const accessToken = jwt.sign(
    { userId: user._id, role: user.role }, // Tambahkan role ke dalam payload
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "80h" }
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
      expiresIn: "100h",
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
// GET All Users
app.get("/get-user", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // Ambil semua data pengguna dari database
    const users = await User.find({}, "-password"); // Exclude password dari hasil query untuk keamanan

    // Jika tidak ada data pengguna
    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ error: true, message: "Tidak ada pengguna ditemukan." });
    }

    // Kirim respons dengan daftar pengguna
    res.status(200).json({
      success: true,
      message: "Daftar pengguna berhasil diambil.",
      data: users,
    });
  } catch (error) {
    // Tangani error
    res.status(500).json({ error: true, message: error.message });
  }
});

// Bagian Deskripsi Tempat Wisata
app.post(
  "/rute-peta/add-description",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
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

      res.status(201).json({
        description: nameDescription,
        message: "Berhasil Ditambahkan",
      });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

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
app.post(
  "/add-tempat-wisata",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
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
  }
);

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
      return res
        .status(404)
        .json({ error: true, message: "Tempat wisata tidak ditemukan" });
    }

    // Cek apakah destinasi sudah ada di favorit
    const existingFavourite = await Favourite.findOne({
      userId,
      tempatWisataId,
    });
    if (existingFavourite) {
      return res.status(400).json({
        error: true,
        message: "Destinasi sudah ada di daftar favorit",
      });
    }

    // Simpan ke koleksi Favourite
    const favourite = new Favourite({ userId, tempatWisataId });
    await favourite.save();

    res.status(200).json({
      success: true,
      message: "Destinasi berhasil ditambahkan ke favorit",
      data: favourite,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Melihat dan Menyimpan Destinasi Favourite
app.get("/favorites", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { tempatWisataId } = req.query; // Ambil ID dari query params

  try {
    // Jika tempatWisataId diberikan, lakukan validasi dan penyimpanan
    if (tempatWisataId) {
      const tempatWisata = await TempatWisata.findById(tempatWisataId);
      if (!tempatWisata) {
        return res
          .status(404)
          .json({ error: true, message: "Tempat wisata tidak ditemukan" });
      }

      // Periksa apakah destinasi sudah ada di favorit
      const existingFavourite = await Favourite.findOne({
        userId,
        tempatWisataId,
      });
      if (!existingFavourite) {
        // Simpan ke koleksi Favourite
        const favourite = new Favourite({ userId, tempatWisataId });
        await favourite.save();
      }
    }

    // Ambil daftar favorit berdasarkan userId
    const favourites = await Favourite.find({ userId }).populate("tempatWisataId");

    if (!favourites || favourites.length === 0) {
      return res
        .status(404)
        .json({ error: true, message: "Tidak ada destinasi favorit ditemukan" });
    }

    res.status(200).json({
      success: true,
      favorites: favourites,
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
    // Hapus destinasi dari koleksi Favourite
    const result = await Favourite.findOneAndDelete({ userId, tempatWisataId });
    if (!result) {
      return res
        .status(404)
        .json({ error: true, message: "Favorit tidak ditemukan" });
    }

    res.status(200).json({
      success: true,
      message: "Destinasi berhasil dihapus dari favorit",
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});


// Menambahkan Event Lokal
app.post(
  "/add-event-lokal",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { imageUrl, eventName, tentangEvent } = req.body;
    const { userId } = req.user;

    if (!imageUrl || !eventName || !tentangEvent) {
      return res
        .status(400)
        .json({ error: true, message: "All fields are required!" });
    }

    // Supaya Tidak Terjasi Spam Event yang sama
    try {
      // Memeriksa apakah eventName sudah ada di database
      const existingEvent = await EventLokal.findOne({ eventName });
      if (existingEvent) {
        return res
          .status(400)
          .json({ error: true, message: "Anda ini Sudah Ada!" });
      }
      // Menyimpan data baru
      const eventLokal = new EventLokal({
        imageUrl,
        eventName,
        tentangEvent,
        userId, // Menyimpan userId sebagai pemilik data jika diperlukan
      });
      await eventLokal.save();
      res.status(201).json({
        description: eventLokal,
        message: "Event Lokal Berhasil Ditambahkan!",
      });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  }
);

// Melihat Semua Event Lokal
app.get("/event-lokal", authenticateToken, async (req, res) => {
  try {
    // Ambil semua tempat wisata dari database
    const eventLokal = await EventLokal.find();

    // Jika tidak ada data
    if (!eventLokal || eventLokal.length === 0) {
      return res
        .status(404)
        .json({ error: true, message: "Event lokal tidak ditemukan." });
    }

    // Kirim respons dengan daftar event lokal
    res.status(200).json({
      success: true,
      message: "Daftar event lokal berhasil diambil.",
      data: eventLokal,
    });
  } catch (error) {
    // Tangani error
    res.status(500).json({ error: true, message: error.message });
  }
});

// Bagian Ganti Password
app.post("/ganti-password", authenticateToken, async (req, res) => {
  const { passwordLama, passwordBaru } = req.body;
  const { userId } = req.user;
  // const isUser = await User.findOne({ _id: userId });
  // Validasi input
  if (!passwordLama || !passwordBaru) {
    return res
      .status(400)
      .json({ error: true, message: "Password lama dan baru diperlukan." });
  }

  try {
    // Cari user berdasarkan ID
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ error: true, message: "User tidak ditemukan." });
    }

    // Periksa apakah password lama sesuai
    const isMatch = await bcrypt.compare(passwordLama, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ error: true, message: "Password lama tidak sesuai." });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(passwordBaru, 10);

    // Perbarui password di database
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password berhasil diperbarui." });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Menambahkan Bagian Log-Out
app.post("/logout", authenticateToken, (req, res) => {
  res.status(200).json({ success: true, message: "Berhasil log-out" });
});

app.listen(2000);
module.exports = app;
