


import HomeClient from "@/components/home-client";

export default function Page({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  return <HomeClient forcedSource={searchParams.source} />;
}