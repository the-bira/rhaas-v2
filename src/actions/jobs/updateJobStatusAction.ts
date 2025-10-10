"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

/**
 * Publica uma vaga (define publishedAt e isActive = true)
 */
export async function publishJobAction(jobId: string) {
  try {
    await db.job.update({
      where: { id: jobId },
      data: {
        publishedAt: new Date(),
        isActive: true,
      },
    });

    revalidatePath("/jobs");
    revalidatePath(`/job/${jobId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao publicar vaga:", error);
    throw new Error("Erro ao publicar vaga");
  }
}

/**
 * Desativa uma vaga (isActive = false)
 */
export async function deactivateJobAction(jobId: string) {
  try {
    await db.job.update({
      where: { id: jobId },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/jobs");
    revalidatePath(`/job/${jobId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao desativar vaga:", error);
    throw new Error("Erro ao desativar vaga");
  }
}

/**
 * Reativa uma vaga (isActive = true)
 */
export async function reactivateJobAction(jobId: string) {
  try {
    await db.job.update({
      where: { id: jobId },
      data: {
        isActive: true,
      },
    });

    revalidatePath("/jobs");
    revalidatePath(`/job/${jobId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao reativar vaga:", error);
    throw new Error("Erro ao reativar vaga");
  }
}

/**
 * Exclui uma vaga (soft delete ou hard delete)
 */
export async function deleteJobAction(jobId: string) {
  try {
    // Você pode fazer soft delete (isActive = false) ou hard delete
    await db.job.delete({
      where: { id: jobId },
    });

    revalidatePath("/jobs");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir vaga:", error);
    throw new Error("Erro ao excluir vaga");
  }
}

