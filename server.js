const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { query } = require("./db"); // Hàm query MySQL
const { DB_NAME } = require("./config");
const { authRequired, adminRequired, issueToken, ADMIN_EMAILS } = require("./auth");

const app = express();
const PORT = 3000;

// Upload config
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${unique}${ext || ".jpg"}`);
  },
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(uploadDir));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", db: DB_NAME }));

// ========================= TOURS =========================
// Danh sách tour (support search ?q=)
app.get("/tours", async (req, res) => {
  try {
    const { q } = req.query;
    const like = q ? `%${q}%` : null;
    const rows = await query(
      `
      SELECT 
        t.*,
        (
          SELECT ti.ImageUrl 
          FROM TourImages ti 
          WHERE ti.TourId = t.Id AND ti.IsPrimary = 1 
          LIMIT 1
        ) AS PrimaryImage
      FROM Tours t
      ${q ? "WHERE t.Title LIKE ? OR t.Destination LIKE ?" : ""}
      ORDER BY t.CreatedAt DESC
      `,
      q ? [like, like] : []
    );
    return res.json(rows);
  } catch (err) {
    console.error("TOURS ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Tạo tour mới (admin)
app.post("/tours", authRequired, adminRequired, async (req, res) => {
  try {
    const {
      Title,
      RegionType,
      Destination,
      DeparturePlace,
      StartDate,
      Duration,
      Price,
      PromotionText,
      PromotionAmount,
      ShortDescription,
      IsHot = 0,
    } = req.body;

    if (!Title || !Destination || !DeparturePlace || !StartDate || !Duration || Price == null) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const result = await query(
      `INSERT INTO Tours 
      (Title, RegionType, Destination, DeparturePlace, StartDate, Duration, Price, PromotionText, PromotionAmount, ShortDescription, IsHot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Title,
        RegionType,
        Destination,
        DeparturePlace,
        StartDate,
        Duration,
        Price,
        PromotionText || null,
        PromotionAmount || 0,
        ShortDescription || null,
        IsHot ? 1 : 0,
      ]
    );

    return res.json({ message: "Tạo tour thành công", id: result.insertId });
  } catch (err) {
    console.error("CREATE TOUR ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Cập nhật tour (admin)
app.put("/tours/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Title,
      RegionType,
      Destination,
      DeparturePlace,
      StartDate,
      Duration,
      Price,
      PromotionText,
      PromotionAmount,
      ShortDescription,
      IsHot,
    } = req.body;

    const rows = await query("SELECT Id FROM Tours WHERE Id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Không tìm thấy tour" });

    await query(
      `UPDATE Tours 
       SET Title=?, RegionType=?, Destination=?, DeparturePlace=?, StartDate=?, Duration=?,
           Price=?, PromotionText=?, PromotionAmount=?, ShortDescription=?, IsHot=?
       WHERE Id=?`,
      [
        Title,
        RegionType,
        Destination,
        DeparturePlace,
        StartDate,
        Duration,
        Price,
        PromotionText || null,
        PromotionAmount || 0,
        ShortDescription || null,
        IsHot ? 1 : 0,
        id,
      ]
    );

    return res.json({ message: "Cập nhật tour thành công" });
  } catch (err) {
    console.error("UPDATE TOUR ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Xóa tour (admin)
app.delete("/tours/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query("SELECT Id FROM Tours WHERE Id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Không tìm thấy tour" });
    await query("DELETE FROM Tours WHERE Id = ?", [id]);
    return res.json({ message: "Xóa tour thành công" });
  } catch (err) {
    console.error("DELETE TOUR ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Chi tiết tour
app.get("/tours/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query("SELECT * FROM Tours WHERE Id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Không tìm thấy tour" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("TOUR DETAIL ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Ảnh của tour
app.get("/tours/:id/images", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      "SELECT * FROM TourImages WHERE TourId = ? ORDER BY IsPrimary DESC, Id ASC",
      [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("TOUR IMAGES ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Upload ảnh tour (admin)
app.post("/tours/:id/images", authRequired, adminRequired, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "Chưa có file ảnh" });

    const isPrimary = req.body?.isPrimary === "1" ? 1 : 0;
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const result = await query(
      "INSERT INTO TourImages (TourId, ImageUrl, IsPrimary) VALUES (?, ?, ?)",
      [id, imageUrl, isPrimary]
    );

    const insertedId = result?.insertId;
    if (isPrimary && insertedId) {
      await query("UPDATE TourImages SET IsPrimary = 0 WHERE TourId = ? AND Id <> ?", [id, insertedId]);
    }

    return res.json({ message: "Upload ảnh thành công", imageUrl, id: insertedId });
  } catch (err) {
    console.error("UPLOAD TOUR IMAGE ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Lịch trình tour
app.get("/tours/:id/schedules", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      "SELECT * FROM TourSchedules WHERE TourId = ? ORDER BY DayNumber ASC",
      [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("TOUR SCHEDULE ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// ========================= AUTH =========================

// Đăng ký
app.post("/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    console.log("[REGISTER] payload:", { email, full_name });
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await query("INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)", [
      full_name,
      email,
      hashed,
    ]);
    console.log("[REGISTER] success:", email);
    return res.json({ message: "Đăng ký thành công" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      console.log("[REGISTER] duplicate email:", req.body?.email);
      return res.status(400).json({ message: "Email đã tồn tại" });
    }
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Đăng nhập
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("[LOGIN] payload:", { email });
    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
    }
    const rows = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) {
      console.log("[LOGIN] email not found:", email);
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log("[LOGIN] wrong password for:", email);
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const { token, role } = issueToken(user);
    console.log("[LOGIN] success:", email, "role:", role);
    return res.json({
      user: { id: user.id, full_name: user.full_name, email: user.email, role },
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Danh sách người dùng (admin)
app.get("/users", authRequired, adminRequired, async (_req, res) => {
  try {
    const columns = await query("SHOW COLUMNS FROM users");
    const hasCreatedAt = columns.some((c) => c.Field === "created_at" || c.Field === "createdAt");
    const activeField =
      (columns.find((c) => c.Field === "is_active") && "is_active") ||
      (columns.find((c) => c.Field === "active") && "active");

    const selectCols = ["id", "full_name", "email"];
    if (hasCreatedAt) selectCols.push("created_at");
    if (activeField) selectCols.push(activeField);

    const rows = await query(`SELECT ${selectCols.join(", ")} FROM users ORDER BY id DESC`);
    const users = rows.map((u) => {
      const email = u.email || "";
      const emailLower = email.toLowerCase();
      const role = ADMIN_EMAILS.includes(emailLower) ? "admin" : "user";
      return {
        id: u.id,
        full_name: u.full_name,
        email,
        role,
        registered_at: hasCreatedAt ? u.created_at : null,
        is_active: activeField ? !!u[activeField] : true,
      };
    });

    return res.json({ users });
  } catch (err) {
    console.error("LIST USERS ERROR:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// ========================= CART =========================
const cartRouter = express.Router();

// GET CART
cartRouter.get("/", authRequired, async (req, res) => {
  const userId = req.user.id;

  let [cart] = await query("SELECT * FROM carts WHERE user_id = ?", [userId]);
  if (!cart) {
    const r = await query("INSERT INTO carts (user_id) VALUES (?)", [userId]);
    cart = { id: r.insertId };
  }

  const items = await query(`
    SELECT t.Id, t.Title, t.Price, ci.quantity,
      (SELECT ImageUrl FROM TourImages WHERE TourId = t.Id AND IsPrimary = 1 LIMIT 1) AS Image
    FROM cart_items ci
    JOIN Tours t ON ci.tour_id = t.Id
    WHERE ci.cart_id = ?
  `, [cart.id]);

  res.json(items);
});

// ADD TO CART (tăng quantity nếu đã tồn tại)
cartRouter.post("/add", authRequired, async (req, res) => {
  const { tourId } = req.body;
  const userId = req.user.id;

  let [cart] = await query("SELECT * FROM carts WHERE user_id = ?", [userId]);
  if (!cart) {
    const r = await query("INSERT INTO carts (user_id) VALUES (?)", [userId]);
    cart = { id: r.insertId };
  }

  // CHỈNH SỬA: ON DUPLICATE tăng quantity
  await query(`
    INSERT INTO cart_items (cart_id, tour_id, quantity)
    VALUES (?, ?, 1)
    ON DUPLICATE KEY UPDATE quantity = quantity + 1
  `, [cart.id, tourId]);

  res.json({ message: "OK" });
});

// REMOVE FROM CART (giảm quantity, xóa nếu quantity = 0)
cartRouter.delete("/remove/:tourId", authRequired, async (req, res) => {
  const { tourId } = req.params;
  const userId = req.user.id;

  const [cart] = await query("SELECT * FROM carts WHERE user_id = ?", [userId]);
  if (!cart) return res.json({});

  await query(`
    UPDATE cart_items
    SET quantity = quantity - 1
    WHERE cart_id = ? AND tour_id = ? AND quantity > 1
  `, [cart.id, tourId]);

  await query(`
    DELETE FROM cart_items
    WHERE cart_id = ? AND tour_id = ? AND quantity <= 0
  `, [cart.id, tourId]);

  res.json({ message: "OK" });
});

// Gắn router vào app
app.use("/cart", cartRouter);

// ========================= START SERVER =========================
app.listen(PORT, () => {
  console.log(`Backend đang chạy http://localhost:${PORT}`);
});
