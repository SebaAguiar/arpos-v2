import { NextResponse } from 'next/server';
import { getLicensePublicKey } from '@/server/license-signer';

export async function GET() {
  try {
    return NextResponse.json({ publicKey: getLicensePublicKey() });
  } catch (error) {
    console.error('[license-public-key] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
