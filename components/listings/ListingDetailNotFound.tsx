import Link from "next/link";

export function ListingDetailNotFound() {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-sm font-semibold text-neutral-700">Listing not found</h1>
      <Link
        href="/listings"
        className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:underline"
      >
        Back to listings
      </Link>
    </div>
  );
}
