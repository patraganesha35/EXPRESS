import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  let url = "";

  if (q) {
    const limit = searchParams.get("limit") || "8";
    const addressdetails = searchParams.get("addressdetails") || "1";
    url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit}&addressdetails=${addressdetails}`;
  } else if (lat && lon) {
    const zoom = searchParams.get("zoom") || "18";
    const addressdetails = searchParams.get("addressdetails") || "1";
    url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=${zoom}&addressdetails=${addressdetails}`;
  } else {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "RydexGeocodingProxy/1.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from Nominatim" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
