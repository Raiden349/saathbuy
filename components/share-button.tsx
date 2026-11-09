import Link from "next/link";

export function ShareButton({ title, slug, price, siteUrl, referrerId }: { title: string; slug: string; price: number; siteUrl: string; referrerId: string }) {
  const url = new URL(`/deals/${encodeURIComponent(slug)}`, siteUrl);
  url.searchParams.set("ref", referrerId);
  const text = `Join me on ${title}. It is Rs. ${price} now and drops as more people join: ${url.toString()}`;
  return <Link className="button-secondary share-button" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">Share on WhatsApp</Link>;
}
