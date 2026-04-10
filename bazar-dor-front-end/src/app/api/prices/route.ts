import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, bazar_id, price, user_id, photo_url } = body;

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO prices_raw (product_id, bazar_id, user_id, price, photo_url, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    stmt.run(product_id, bazar_id, user_id, price, photo_url, ip);

    return NextResponse.json({ success: true, message: 'Price submitted successfully' });
  } catch (error) {
    console.error('Error submitting price:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit price' },
      { status: 500 }
    );
  }
}
