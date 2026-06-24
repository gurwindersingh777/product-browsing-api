import express from 'express';
import 'dotenv/config';
import productRouter from './routes/product.route.js';

const app = express();

app.use(express.json());

app.use("/products", productRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})