import { redirect } from "next/navigation";

export default async function StatsRedirect({ params }: PageProps<"/stats/[code]">) {
  const { code } = await params;
  redirect(`/track/${code}`);
}
