import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff-proxy';

type RouteContext = { params: { path: string[] } };

async function handle(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, context.params.path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
