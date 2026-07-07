import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ApiClientError } from "@/lib/api-client";
import { LeadDetailContent } from "@/modules/crm/components/lead-detail-content";
import { getLead } from "@/modules/crm/queries/get-lead";
import { getLeadActivities } from "@/modules/crm/queries/get-lead-activities";

type LeadDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  let lead: Awaited<ReturnType<typeof getLead>>;
  let activities: Awaited<ReturnType<typeof getLeadActivities>>;

  try {
    [lead, activities] = await Promise.all([getLead(id), getLeadActivities(id)]);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        description={lead.email}
        back={{ label: "Leads", href: "/leads" }}
      />
      <LeadDetailContent lead={lead} initialActivities={activities} />
    </div>
  );
}
