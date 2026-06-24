# 📦 Product Browsing API

A scalable backend API for browsing a large product catalog (200,000+ products) with fast cursor-based pagination, category filtering, stable ordering, and snapshot-based consistency.

Built with **Node.js**, **Express**, **PostgreSQL (Neon)**, and **Prisma**.

🔗 **Live URL:** https://product-browsing-api-vfh9.onrender.com

---

## 🚀 Features

| Feature | Description |
|---|---|
| ✅ Product Listing | Fetch products ordered by newest first |
| ✅ Category Filtering | Filter products by category |
| ✅ Cursor Pagination | Efficient keyset pagination — no `OFFSET` |
| ✅ Snapshot Consistency | Stable dataset per browsing session — no duplicates or missing items |

---

## 🌐 Base URL

```
https://product-browsing-api-vfh9.onrender.com
```

---

## 📡 API Endpoints

### 1. Get All Products (Page 1)

```http
GET https://product-browsing-api-vfh9.onrender.com/products
```

**Response**
```json
{
  "data": [...],
  "pagination": {
    "snapshotTime": "2026-06-24T10:00:00.000Z",
    "hasMore": true,
    "nextCursor": "eyJsYXN0RGF0ZSI6..."
  }
}
```

---

### 2. Filter by Category

```http
GET https://product-browsing-api-vfh9.onrender.com/products?category=Electronics
```

Available categories: `Electronics`, `Fashion`, `Home`, `Sports`, `Books`, `Beauty`, `Toys`, `Grocery`

---

### 3. Next Page (Cursor Pagination)

```http
GET https://product-browsing-api-vfh9.onrender.com/products?cursor=<cursor>&snapshotTime=<snapshotTime>
```

> Copy `nextCursor` and `snapshotTime` from the previous response.

When pagination ends:
```json
{
  "hasMore": false,
  "nextCursor": null
}
```

---

### 4. Category + Pagination Combined

```http
GET https://product-browsing-api-vfh9.onrender.com/products?category=Electronics&cursor=<cursor>&snapshotTime=<snapshotTime>
```

---

## 🔁 Pagination Flow

```
Step 1 — First request
GET /products
→ Returns snapshotTime + nextCursor

Step 2 — Subsequent requests
GET /products?cursor=...&snapshotTime=...

Step 3 — Repeat until hasMore: false
```

---

## 🧪 Quick Test URLs

Paste these directly in your browser or Postman:

```
# Page 1
https://product-browsing-api-vfh9.onrender.com/products

# Electronics only
https://product-browsing-api-vfh9.onrender.com/products?category=Electronics

# Fashion only
https://product-browsing-api-vfh9.onrender.com/products?category=Fashion

# Invalid cursor test (expect 400)
https://product-browsing-api-vfh9.onrender.com/products?cursor=notvalid
```

---

## 🧠 Core Concepts

### Why No OFFSET Pagination?

Traditional `OFFSET` pagination degrades at scale:

```sql
SELECT * FROM Product
ORDER BY createdAt DESC
OFFSET 100000 LIMIT 20;
-- ❌ Scans all skipped rows — O(n) cost
```

### Keyset Pagination (Used Here)

Uses a `(createdAt, id)` cursor instead of offset:

```sql
WHERE
  createdAt < cursorDate
  OR (createdAt = cursorDate AND id < cursorId)
ORDER BY createdAt DESC, id DESC
LIMIT 20;
-- ✅ Constant time — O(log n) via index
```

### Snapshot Consistency

On first request, `snapshotTime = now()` is captured and reused across all subsequent pages:

```sql
WHERE createdAt <= snapshotTime
```

This ensures newly inserted products don't appear mid-session, preventing page shifts and duplicate/missing results.

---

## 🧾 Cursor Format

Each cursor is a Base64-encoded JSON object:

```json
{
  "lastDate": "2026-06-23T22:03:13.722Z",
  "lastId": "uuid-here"
}
```

---

## 🗄 Database Schema

```prisma
model Product {
  id        String   @id @default(uuid())
  name      String
  category  String
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category, createdAt(sort: Desc), id])
}
```

---

## ⚡ Index Strategy

```
@@index([category, createdAt(sort: Desc), id])
```

- `category` → fast filtering
- `createdAt DESC` → newest-first ordering
- `id` → tie-breaker for cursor uniqueness

---

## 🧠 Core Query

```sql
SELECT * FROM Product
WHERE
  createdAt <= snapshotTime
  AND (
    createdAt < cursorDate
    OR (createdAt = cursorDate AND id < cursorId)
  )
ORDER BY createdAt DESC, id DESC
LIMIT 21;
```

> Fetches 21 items to determine `hasMore` — returns 20 to the client.

---

## ⚙️ Performance

| Approach | Complexity |
|---|---|
| OFFSET Pagination | O(n) — degrades with depth |
| Keyset Pagination | O(log n) — constant via index |

Tested with **200,000+ products**. Production-ready for millions of records with high-frequency inserts.

---

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Hosting:** Render

---

## 📁 Project Structure

```
project/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.js
│   ├── prisma.js
│   └── routes/
│       └── product.route.js
├── scripts/
│   └── seed.js
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/gurwindersingh777/product-browsing-api

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Add your DATABASE_URL in .env

# 4. Generate Prisma client
npx prisma generate

# 5. Run seed script
node scripts/seed.js

# 6. Start the server
npm run dev
```

---

## 🧪 Testing Checklist

**Basic**
- [ ] `GET /products` returns 20 items ordered newest-first

**Filtering**
- [ ] Category filter returns only matching products
- [ ] No category leakage across filters

**Pagination**
- [ ] No duplicate products across pages
- [ ] No missing products across pages
- [ ] Cursor encodes and decodes correctly
- [ ] `hasMore` is accurate on last page

**Snapshot Consistency**
- [ ] New products don't appear mid-session
- [ ] Fresh session (no `snapshotTime`) reflects latest catalog

**Performance**
- [ ] First page responds fast
- [ ] Deep page response time is stable

---

## 🚀 Future Improvements

- [ ] Input validation (Zod / Joi)
- [ ] Rate limiting
- [ ] API versioning (`/v1`)
- [ ] Redis caching layer
- [ ] Full-text search (Postgres FTS / Elasticsearch)
- [ ] Product ranking / relevance scoring
- [ ] Observability (structured logging + metrics)
- [ ] Swagger / OpenAPI documentation
- [ ] Automated integration tests

---

## 📋 Summary

This API demonstrates a production-grade approach to scalable product listings:

- **Keyset Pagination** — fast and index-efficient at any depth
- **Snapshot Isolation** — consistent UX with no shifting pages
- **Composite Indexing** — queries optimized for filtering + sorting
- **Stateless Cursors** — no server-side session required
