# Stationery Management System (SMS)

ระบบจัดการการเบิกเครื่องเขียนสำหรับองค์กร 500 คน / 5 บริษัท / HR ส่วนกลาง
รองรับภาษาไทย–อังกฤษ | ธีมน้ำเงิน–ขาว–ทอง | ฟอนต์ Kanit

- **Frontend**: Angular 17 (standalone components, i18n)
- **Backend**: .NET 8 Web API + Entity Framework Core
- **Database**: PostgreSQL 15+
- **UI**: Kanit font, blue/white/gold, responsive, box shadows

---

## 📁 โครงสร้างโปรเจกต์

```
HandleInterStationary/
├── backend/           .NET 8 Web API + EF Core (PostgreSQL)
├── frontend/          Angular 17 (standalone + i18n)
├── docs/              เอกสารเพิ่มเติม
└── README.md
```

---

## ✅ สิ่งที่ต้องติดตั้งไว้ก่อน (Prerequisites)

ติดตั้งโปรแกรมเหล่านี้ก่อน 1 ครั้งบนเครื่องคุณ:

| โปรแกรม | เวอร์ชัน | ลิงก์ดาวน์โหลด |
|---|---|---|
| **.NET SDK** | 8.0 ขึ้นไป | https://dotnet.microsoft.com/download |
| **Node.js** | 20 LTS ขึ้นไป | https://nodejs.org |
| **PostgreSQL** | 15 ขึ้นไป | https://www.postgresql.org/download/ |
| **Angular CLI** | 17 | ติดตั้งด้วยคำสั่ง `npm i -g @angular/cli` |

> 💡 ถ้าใช้ Windows แนะนำติดตั้งผ่านเว็บของแต่ละผลิตภัณฑ์โดยตรง แล้วเปิด PowerShell ใหม่ทุกครั้งหลังติดตั้ง

---

## 🚀 ขั้นตอนที่ 1: เตรียมฐานข้อมูล PostgreSQL

1. เปิดโปรแกรม **pgAdmin** หรือใช้ command line `psql`
2. สร้าง database ชื่อ `stationery_db`:
   ```sql
   CREATE DATABASE stationery_db;
   ```
3. จำ **username / password** ที่ตั้งไว้ตอนติดตั้ง PostgreSQL (default user คือ `postgres`)

---

## 🛠 ขั้นตอนที่ 2: ตั้งค่าและรัน Backend (.NET)

1. เข้าโฟลเดอร์ backend:
   ```bash
   cd backend
   ```
2. แก้ไฟล์ `backend/StationeryApi/appsettings.json` ตรง `ConnectionStrings.Default`
   ให้ตรงกับ user/password ของ PostgreSQL:
   ```json
   "ConnectionStrings": {
     "Default": "Host=localhost;Port=5432;Database=stationery_db;Username=postgres;Password=YOUR_PASSWORD"
   }
   ```
3. Restore packages + สร้างตารางในฐานข้อมูล + ใส่ข้อมูลตัวอย่าง:
   ```bash
   dotnet restore
   dotnet run --project StationeryApi
   ```
   > โปรแกรมจะสร้างตารางให้อัตโนมัติ (ผ่าน `EnsureCreated`) และ seed ข้อมูลตัวอย่าง (ผู้ใช้ / บริษัท / แผนก / รายการเครื่องเขียน)
4. เมื่อรันสำเร็จจะเห็น: `Now listening on: http://localhost:5080`
5. ทดสอบเปิด API doc: http://localhost:5080/swagger

---

## 💻 ขั้นตอนที่ 3: ตั้งค่าและรัน Frontend (Angular)

เปิด terminal **ใหม่อีกหน้าต่างหนึ่ง** (ไม่ต้องปิด backend)

1. เข้าโฟลเดอร์ frontend:
   ```bash
   cd frontend
   ```
2. ติดตั้ง dependencies (ทำครั้งเดียว):
   ```bash
   npm install
   ```
3. รัน dev server:
   ```bash
   npm start
   ```
4. เปิดเว็บ: **http://localhost:4200**

---

## 🔐 บัญชีทดลอง (Sample accounts)

| Email | Role | ใช้ทำอะไร |
|---|---|---|
| `somchai@company-a.co.th` | Employee (แผนก IT, บริษัท A) | เบิกของ / ติดตามสถานะ |
| `manager.it@company-a.co.th` | Department Manager | อนุมัติคำขอในแผนก IT |
| `hr@company-a.co.th` | HR | จัดเตรียมของ / ดู stock |
| `admin@company-a.co.th` | Admin | จัดการระบบทั้งหมด |
| `ceo@company-a.co.th` | Executive | ดูรายงานภาพรวมทุกบริษัท |

> ระบบเดโมนี้ **ไม่ต้องใส่รหัสผ่าน** — พิมพ์อีเมล กดล็อกอินได้ทันที (จำลอง SSO ด้วย company email)

---

## 🗺 หน้าจอทั้งหมด (ตาม Site Map)

- Login
- Dashboard
- Stationery Catalog
- My Requests (Create / Detail / Track)
- Approval
- Warehouse (Pick List / Issue Items / Pickup / Reservation)
- Inventory (Stock / Receive / Adjustment / Transfer / Count)
- Reports
- Administration (User / Company / Department / Item / Category / Approval Workflow / Notification / System Setting)

---

## ❓ ปัญหาที่พบบ่อย

- **`dotnet` command not found** → ปิด/เปิด terminal ใหม่หลังติดตั้ง .NET SDK
- **Connect DB ไม่ได้** → ตรวจว่า PostgreSQL service รันอยู่ และ password ใน `appsettings.json` ถูก
- **`npm install` ช้า/ค้าง** → ลองใช้ `npm install --legacy-peer-deps`
- **Port ชนกัน** → backend ใช้ 5080, frontend ใช้ 4200 — เปลี่ยนได้ที่ `Properties/launchSettings.json` และ `package.json`

---

## 🧑‍💻 สำหรับนักพัฒนา

- Backend hot-reload: `dotnet watch --project backend/StationeryApi`
- Frontend build production: `npm run build` (ผลลัพธ์อยู่ใน `frontend/dist`)
- API base URL ปรับได้ที่ `frontend/src/environments/environment.ts`

Enjoy 🎉
