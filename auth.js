const jwt = require("jsonwebtoken");

// Cấu hình cơ bản: danh sách email có quyền admin và secret ký JWT
const ADMIN_EMAILS = ["admin@gmail.com", "admin@example.com"];
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

// Middleware kiểm tra đăng nhập
function authRequired(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

// Middleware kiểm tra quyền admin
function adminRequired(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Không có quyền admin" });
  }
  next();
}

// Hàm tạo token, auto gán role theo email
function issueToken(user) {
  const role = ADMIN_EMAILS.includes(user.email) ? "admin" : "user";
  const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: "7d" });
  return { token, role };
}

module.exports = { authRequired, adminRequired, issueToken, JWT_SECRET, ADMIN_EMAILS };
