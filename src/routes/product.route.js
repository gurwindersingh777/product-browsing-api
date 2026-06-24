import { Router } from "express";
import { prisma } from "../prisma.js";


const productRouter = Router();

// GET /products

function encodeCursor(lastDate, lastId) {
  const cursorObj = {
    lastDate: lastDate.toISOString(),
    lastId
  }
  return Buffer.from(JSON.stringify(cursorObj)).toString('base64')
}

function decodeCursor(cursorString) {
  try {
    const jsonString = Buffer.from(cursorString, 'base64').toString('utf-8')
    return JSON.parse(jsonString)
  } catch (error) {
    return null
  }
}

productRouter.get("/", async (req, res) => {
  try {
    const { category, cursor, snapshotTime } = req.query
    const LIMIT = 20

    // If the client doesn't provide a snapshotTime (Page 1), we freeze it at exactly right now.
    const sessionSnapshot = snapshotTime ? new Date(snapshotTime) : new Date()

    // Decode the Base64 Cursor 
    let keysetWhere = {}
    if (cursor) {
      const decoded = decodeCursor(cursor)
      if (!decoded) {
        return res.status(400).json({ error: 'Invalid cursor format' })
      }
      keysetWhere = {
        OR: [
          { createdAt: { lt: new Date(decoded.lastDate) } },
          { createdAt: new Date(decoded.lastDate), id: { lt: decoded.lastId } }
        ]
      }
    }

    // Query Database with Snapshot Constraint
    const products = await prisma.product.findMany({
      take: LIMIT + 1,
      where: {
        ...(category && { category }),
        createdAt: { lte: sessionSnapshot },
        ...keysetWhere
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ]
    })

    // Resolve Pagination State
    const hasMore = products.length > LIMIT
    const data = hasMore ? products.slice(0, LIMIT) : products
    const lastItem = data.length > 0 ? data[data.length - 1] : null
    const nextCursor = (hasMore && lastItem) ? encodeCursor(lastItem.createdAt, lastItem.id) : null

    res.json({
      data: data,
      pagination: {
        snapshotTime: sessionSnapshot.toISOString(),
        hasMore: hasMore,
        nextCursor
      }
    })

  } catch (error) {
    console.error("Database Query Failure:", error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

export default productRouter