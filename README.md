# Full NestJS Project (Without Redis)

A complete project using **NestJS** for a user and record management application, without using Redis.

---

## 🧩 Features

- JWT authentication (user and administrator login).

- Multiple permissions (User/Admin).

- User management (create, edit, delete, search).

- Product management (add, update, delete, search).

- Cart management and items within it.

- Logs system to track transactions.

- Use TypeORM with an SQL database.

- Organized modules (Modules / Services / Controllers / DTOs).

---

## ⚙️ المتطلبات

- Node.js >= 18

- npm >= 9

- MySQL or PostgreSQL database

- Set up a `.env` file containing the following variables:

---

## .env

```env
EMAIL=""
PASSWORD=""
JWT_SECRET=""
JWT_EXPIRES_ACCESSTOKEN=""
JWT_EXPIRES_REFRESHTOKEN=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL=""
DB_PASS=""
DB_HOST=""
DB_PORT=
DB_USER=""
DB_NAME=""
// development
DB_POOL_SIZE=
// production
// DB_POOL_SIZE=
CORS=""
PORT=
eviroment=""

```
  
### البدأ في المشروع

- انشأ ملف `.env` ثم ادخل البيانات المطلوبه
- شغل `npm i`
- شغل `npm run build`
- شغل `npm run start:dev`
