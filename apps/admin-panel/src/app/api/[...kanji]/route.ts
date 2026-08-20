import { getKanjiApp } from '@/lib/kanji';

async function handleKanjiRequest(request: Request) {
  const { app } = await getKanjiApp();
  return app.fetch(request);
}

export async function GET(request: Request) {
  return handleKanjiRequest(request);
}

export async function POST(request: Request) {
  return handleKanjiRequest(request);
}

export async function PUT(request: Request) {
  return handleKanjiRequest(request);
}

export async function DELETE(request: Request) {
  return handleKanjiRequest(request);
}

export async function PATCH(request: Request) {
  return handleKanjiRequest(request);
}
