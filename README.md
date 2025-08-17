# Chat App

Ứng dụng chat realtime gồm 2 phần: **Frontend (React + Vite + TailwindCSS)** và **Backend (Node.js + Express + MongoDB)**.

## Cài đặt

```bash
# Cài đặt dependencies cho frontend
cd client
npm install

# Cài đặt dependencies cho backend
cd ../server
npm install
```

## Chạy dự án

```bash
# Chạy frontend
cd client
npm run dev

# Chạy backend
cd ../server
npm start
```

## Cấu hình

- Tạo file `.env` trong thư mục `server/` theo mẫu `.env.example` (nếu có).
- Đảm bảo đã cài đặt MongoDB hoặc sử dụng MongoDB Atlas.

## Thư mục chính

- `client/`: Source code giao diện người dùng (React)
- `server/`: Source code backend (Express)
