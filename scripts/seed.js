import { prisma } from "../src/prisma.js"

const TOTAL_RECORDS = 200000
const BATCH_SIZE = 1000
const TOTAL_BATCHES = TOTAL_RECORDS / BATCH_SIZE // 200 batches

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Beauty', 'Toys', 'Grocery']

async function generateProducts() {
  console.log("Starting generation of products")

  try {
    // Outer Loop nun 200 times (Batches)
    for (let batchIndex = 0; batchIndex < TOTAL_BATCHES; batchIndex++) {
      const productsBatch = []

      // Inner Loop run 1,000 times (Items inside the batch)
      for (let itemIndex = 0; itemIndex < BATCH_SIZE; itemIndex++) {

        // Calculate which product number we are on globally (1 to 200000)
        const globalIdNumber = batchIndex * BATCH_SIZE + itemIndex + 1
        // Pick a random category from the array
        const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
        // Generate a random price between 100 and 50,000
        const randomPrice = Math.floor(Math.random() * (50000 - 100 + 1)) + 100

        // Create a date and subtract random days/hours so they are not all the same
        const randomDays = Math.floor(Math.random() * 181)
        const randomHours = Math.floor(Math.random() * 24)

        const generatedDate = new Date()
        generatedDate.setDate(generatedDate.getDate() - randomDays)
        generatedDate.setHours(generatedDate.getHours() - randomHours)

        productsBatch.push({
          name: `${randomCategory} Item ${globalIdNumber}`,
          category: randomCategory,
          price: randomPrice,
          createdAt: generatedDate,
          updatedAt: generatedDate
        })
      }

      // Insert batch
      await prisma.product.createMany({
        data: productsBatch
      })

      console.log(`Batch ${batchIndex + 1} of ${TOTAL_BATCHES} completed.`);
    }
    console.log("200,000 products generated Successfully")

  } catch (error) {
    console.error("something went wrong:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

generateProducts()



// async function generateSingleProduct() {
//   try {
//     const newProduct = await prisma.product.create({
//       data: {
//         name: "New Product " + new Date().getTime(),
//         category: "Electronics",
//         createdAt: new Date(),
//         price: 99.99
//       },
//     })
//     console.log("Created new product:", newProduct);
//   } catch (e) {
//     console.error(e)
//   } finally {
//     async () => await prisma.$disconnect()
//   }
// }
