


import HomeClient from "@/components/home-client";

type PageProps = {
  searchParams: Promise<{
    source?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return <HomeClient forcedSource={params.source} />;
}