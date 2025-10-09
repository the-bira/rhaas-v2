import MultiStepCandidateForm from './MultiStepCandidateForm';

export function JobApplyForm({
  jobId,
  tenantId,
}: {
  jobId: string;
  tenantId: string;
}) {
  return <MultiStepCandidateForm jobId={jobId} tenantId={tenantId} />;
}
