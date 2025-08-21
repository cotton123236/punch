import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UPSTREAM_ORIGIN = process.env.NEXT_PUBLIC_UPSTREAM_ORIGIN || ''

async function handleProxy(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  let targetPath = (searchParams.get('path') as string | undefined) || ''

  if (!targetPath) {
    return new Response(JSON.stringify({ message: 'Missing required query parameter: path' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    })
  }

  if (!targetPath.startsWith('/')) {
    targetPath = `/${targetPath}`
  }

  const targetUrl = `${UPSTREAM_ORIGIN}${targetPath}`

  try {
    const forwardHeaders = new Headers()
    const headersToForward = ['accept', 'content-type', 'cookie', 'authorization']

    headersToForward.forEach((headerName) => {
      const value = request.headers.get(headerName)
      if (value) {
        if (headerName === 'cookie') {
          forwardHeaders.set(
            headerName,
            `${value}; PID=${process.env.NEXT_PUBLIC_DEFAULT_PID}; CID=${process.env.NEXT_PUBLIC_DEFAULT_CID}; MDMKEY=${process.env.NEXT_PUBLIC_DEFAULT_MDMKEY}; proapp=1`
          )
        } else {
          forwardHeaders.set(headerName, value)
        }
      }
    })

    let requestBody
    const methodHasBody = !(request.method === 'GET' || request.method === 'HEAD')
    if (methodHasBody) {
      const contentType = (request.headers.get('content-type') || '').toLowerCase()
      if (!contentType.includes('application/json')) {
        return new Response(JSON.stringify({ message: 'Unsupported Media Type: only application/json is allowed' }), {
          status: 415,
          headers: { 'content-type': 'application/json' }
        })
      }
      forwardHeaders.set('content-type', 'application/json')
      requestBody = request.body
    }

    const init: RequestInit = {
      method: request.method,
      headers: forwardHeaders,
      body: methodHasBody ? requestBody : undefined,
      redirect: 'manual',
      credentials: 'include',
      // @ts-expect-error - duplex is required for streaming body
      duplex: methodHasBody ? 'half' : undefined
    }

    const upstreamResponse = await fetch(targetUrl, init)

    // Mirror upstream response (status, headers, and stream body)
    const responseHeaders = new Headers(upstreamResponse.headers)
    // Remove hop-by-hop headers that should not be forwarded back
    responseHeaders.delete('connection')
    responseHeaders.delete('transfer-encoding')
    responseHeaders.delete('keep-alive')
    responseHeaders.delete('proxy-authenticate')
    responseHeaders.delete('proxy-authorization')
    responseHeaders.delete('te')
    responseHeaders.delete('trailers')
    responseHeaders.delete('upgrade')
    responseHeaders.delete('content-encoding')
    responseHeaders.delete('content-length')

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders
    })
  } catch (error) {
    const message = (error as Error)?.message || 'Proxy request failed'
    return new Response(JSON.stringify({ message, path: targetPath }), {
      status: 502,
      headers: { 'content-type': 'application/json' }
    })
  }
}

export async function GET(request: NextRequest) {
  return handleProxy(request)
}

export async function POST(request: NextRequest) {
  return handleProxy(request)
}

export async function PUT(request: NextRequest) {
  return handleProxy(request)
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request)
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request)
}

export async function OPTIONS(request: NextRequest) {
  return handleProxy(request)
}
