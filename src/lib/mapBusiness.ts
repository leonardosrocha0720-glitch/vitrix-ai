import type { RawPlace } from "@/lib/googlePlaces";
import type { Business } from "@/types/business";

export function mapPlaceToBusiness(place: RawPlace): Business {
  const website = place.website ?? place.links?.website ?? null;

  const mapsUrl = place.place_id
    ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.title} ${place.address ?? ""}`.trim(),
      )}`;

  return {
    id: place.place_id ?? place.data_id ?? String(place.position ?? Math.random()),
    name: place.title,
    address: place.address ?? "",
    phone: place.phone ?? null,
    rating: place.rating ?? null,
    reviewCount: place.reviews ?? 0,
    website: website || null,
    mapsUrl,
  };
}
