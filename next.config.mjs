/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://cdn-lfs.huggingface.co https://*.xethub.hf.co https://*.hf.co blob:; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
      { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ]
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/taskjar-voice-worker.js", headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }] },
      { source: "/taskjar-pcm-worklet.js", headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }] },
    ]
  },
}

export default nextConfig
