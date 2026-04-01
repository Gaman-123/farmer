import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ transaction_id: string }> }) {
  const { transaction_id } = await params;
  try {
    const res = await pool.query(
      `SELECT t.*, gi.invoice_number, gi.pdf_url
       FROM transactions t
       LEFT JOIN gst_invoices gi ON t.transaction_id = gi.transaction_id
       WHERE t.transaction_id = $1`, [transaction_id]
    );
    if (!res.rows[0]) return errorResponse("TXN_NOT_FOUND", "Transaction not found", 404);
    return NextResponse.json(res.rows[0]);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e.message }, { status: 500 });
  }
}
