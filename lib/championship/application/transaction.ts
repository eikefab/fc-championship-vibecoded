import "server-only"
import { Prisma } from "@/app/generated/prisma/client"

const MAX_RETRIES = 3

export async function serializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  client: Prisma.TransactionClient,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn(client)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        if (attempt === MAX_RETRIES) throw error
        continue
      }
      throw error
    }
  }
  throw new Error("Unreachable")
}
