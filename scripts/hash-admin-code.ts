import readline from 'node:readline'
import bcrypt from 'bcryptjs'

async function main() {
  let code = process.argv[2]
  if (!code) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    code = await new Promise<string>((resolve) => rl.question('Choose an admin code: ', (a) => (rl.close(), resolve(a))))
  }
  code = code.trim()
  if (code.length < 8) {
    console.error('Use an admin code of at least 8 characters (longer is better).')
    process.exit(1)
  }
  const hash = await bcrypt.hash(code, 12)
  // Base64 keeps the "$" characters in the bcrypt hash from being expanded by .env loaders.
  console.log('\nAdd this line to your .env file:\n')
  console.log(`ADMIN_CODE_HASH_B64="${Buffer.from(hash).toString('base64')}"\n`)
}

main()
