import { fetchCategories } from "@/utils/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch classifications from Ticketmaster API
    const classifications = await fetchCategories();

    // Return the classifications as categories
    return NextResponse.json({
      categories: classifications,
      count: classifications.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
