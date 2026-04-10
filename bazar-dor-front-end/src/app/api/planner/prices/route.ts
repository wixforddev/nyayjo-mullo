import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const prices = db.prepare(`
      SELECT product_id, bazar_id, median_price, confidence_score
      FROM prices_verified
      WHERE confidence_score > 60
    `).all();

    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
