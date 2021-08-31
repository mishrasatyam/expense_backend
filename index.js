import { randomUUID as uuid } from 'crypto';
import jwt from 'fastify-jwt'
import auth_routes from './auth_routes.js'
import protected_routes from './protected_routes.js'
import cookies from 'fastify-cookie'
import fastify_fw from 'fastify'
import cors from 'fastify-cors'
const fastify = fastify_fw({ logger: true })
const env = process.argv[2]=='prod'?'prod':'dev'
  
fastify.register(jwt, {
  secret: uuid(),
  sign:{
    expiresIn:'7d'
  }
})


fastify.register(cookies, {
  secret: uuid(), // for cookies signature
  // parseOptions: {
  // }     // options for parsing cookies
})


fastify.register(cors, {origin:env=='prod'?'https://expense.satyam.life':'http://localhost:3000',credentials:true,methods:['GET','POST']})
  
fastify.register(auth_routes)
fastify.register(protected_routes)
// Run the server!


const start = async () => {
  try {
    await fastify.listen(8000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()