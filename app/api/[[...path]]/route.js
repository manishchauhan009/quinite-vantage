import { NextResponse } from 'next/server'

// Minimal fallback for any unmatched /api/* routes after refactor.
const fallback = (method) =>
  NextResponse.json(
    { error: `This API has been refactored. Use specific endpoints under /api (method: ${method})` },
    { status: 404 }
  )

export async function GET() {
  return fallback('GET')
}

export async function POST() {
  return fallback('POST')
}

export async function PUT() {
  return fallback('PUT')
}

export async function DELETE() {
  return fallback('DELETE')
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 })
}
