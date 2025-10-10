"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

/**
 * Deleta um candidato e sua candidatura (JobApplication)
 * Remove todos os registros associados
 */
export async function deleteCandidateAction(
  candidateId: string,
  jobId?: string
) {
  try {
    await db.$transaction(async (tx) => {
      // 1. Deletar JobApplications do candidato
      if (jobId) {
        // Deletar apenas da vaga específica
        await tx.jobApplication.deleteMany({
          where: {
            candidateId,
            jobId,
          },
        });
      } else {
        // Deletar todas as candidaturas
        await tx.jobApplication.deleteMany({
          where: {
            candidateId,
          },
        });
      }

      // 2. Deletar FinalScores
      if (jobId) {
        await tx.finalScore.deleteMany({
          where: {
            candidateId,
            jobId,
          },
        });
      } else {
        await tx.finalScore.deleteMany({
          where: {
            candidateId,
          },
        });
      }

      // 3. Deletar Interviews relacionadas
      if (jobId) {
        await tx.interview.deleteMany({
          where: {
            candidateId,
            jobId,
          },
        });
      } else {
        await tx.interview.deleteMany({
          where: {
            candidateId,
          },
        });
      }

      // 4. Deletar AssessmentResults
      await tx.assessmentResult.deleteMany({
        where: {
          candidateId,
        },
      });

      // 5. Finalmente, deletar o candidato (se não tiver mais candidaturas)
      if (!jobId) {
        await tx.candidate.delete({
          where: { id: candidateId },
        });
      } else {
        // Se deletando de uma vaga específica, verificar se ainda tem outras candidaturas
        const remainingApplications = await tx.jobApplication.count({
          where: { candidateId },
        });

        if (remainingApplications === 0) {
          // Sem outras candidaturas, pode deletar o candidato
          await tx.candidate.delete({
            where: { id: candidateId },
          });
        }
      }
    });

    revalidatePath("/jobs");
    if (jobId) {
      revalidatePath(`/jobs/${jobId}/candidates`);
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar candidato:", error);
    throw new Error("Erro ao deletar candidato");
  }
}

