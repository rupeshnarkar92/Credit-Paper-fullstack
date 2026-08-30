const ALGORITHM = { name: 'AES-GCM', length: 256 }

function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function getKey() {
  const keyB64 = import.meta.env.VITE_ENCRYPTION_KEY || ''
  if (!keyB64) {
    throw new Error('ENCRYPTION_KEY not set')
  }
  const keyData = base64ToArrayBuffer(keyB64)
  return crypto.subtle.importKey('raw', keyData, ALGORITHM, false, ['encrypt', 'decrypt'])
}

export async function encrypt(data) {
  const key = await getKey()
  const encoder = new TextEncoder()
  const plaintext = encoder.encode(JSON.stringify(data))
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    plaintext
  )
  const combined = new Uint8Array(nonce.length + ciphertext.byteLength)
  combined.set(nonce, 0)
  combined.set(new Uint8Array(ciphertext), nonce.length)
  return arrayBufferToBase64(combined.buffer)
}

export async function decrypt(token) {
  const key = await getKey()
  const decoder = new TextDecoder()
  const raw = base64ToArrayBuffer(token)
  const nonce = new Uint8Array(raw.slice(0, 12))
  const ciphertext = raw.slice(12)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    ciphertext
  )
  return JSON.parse(decoder.decode(plaintext))
}
