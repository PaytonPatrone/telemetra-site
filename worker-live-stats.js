addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Determine which HTML file to serve based on the path
  let htmlFile = 'index.html'
  if (pathname.startsWith('/payton')) {
    htmlFile = 'payton/index.html'
  } else if (pathname.startsWith('/stephen')) {
    htmlFile = 'stephen/index.html'
  } else if (pathname.startsWith('/retail')) {
    htmlFile = 'retail/index.html'
  } else if (pathname.startsWith('/wholesale')) {
    htmlFile = 'wholesale/index.html'
  }

  const htmlUrl = `https://raw.githubusercontent.com/PaytonPatrone/telemetra-site/main/${htmlFile}`

  try {
    const response = await fetch(htmlUrl)
    const html = await response.text()

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'cache-control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (e) {
    return new Response('Service temporarily unavailable', { status: 503 })
  }
}
