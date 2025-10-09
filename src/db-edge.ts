import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "@/generated/prisma/edge";

export const db = new PrismaClient().$extends(withAccelerate());
