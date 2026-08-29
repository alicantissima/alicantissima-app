


import HomeClient from "@/components/home-client";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function WalkinPage() {
  return <HomeClient forcedSource="walkin" />;
}