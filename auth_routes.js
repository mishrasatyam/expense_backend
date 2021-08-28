import {MongoClient} from 'mongodb';
import {db_name,mongo_url,sha512,genSalt  } from './utils.js';

const loginBodyJsonSchema = {
    type: 'object',
    required: ['username','password'],
    properties: {
      username: { type: 'string' },
      password: { type: 'string'},
    }
}

const loginSchema = {
    body: loginBodyJsonSchema
}

const signupBodyJsonSchema = {
    type: 'object',
    required: ['username','password'],
    properties: {
      username: { type: 'string' },
      password: { type: 'string' }
    }
}

const signupSchema = {
    body: signupBodyJsonSchema
}

export default async function(fastify, opts, done){
    
    fastify.post('/login/',{schema:loginSchema},async (request, reply) => {
        const mongo_connect = await MongoClient.connect(mongo_url,{useUnifiedTopology: true }).catch((err)=>{request.log.info("Error while connecting to mongo db!");throw err});
        const database = await mongo_connect.db(db_name)
        const {username,password} = request.body;
        const result = await database.collection('user').findOne({username}).catch((err)=>{request.log.info('Error while looking inside user collection!')})  
        await mongo_connect.close();
        if(result==null){
            const error = 'User does not exists!'
            return reply.code(401).send({message:error})
        }else if(result.hashed_password == sha512(password.toString(),result.salt).hashed_password ){    
            const body = {username}
            const token = fastify.jwt.sign(body)
            return reply.setCookie('jwt',token,{signed: true,httpOnly:true, path:'/'}).code(200).send()
        }else{
            const error = 'Invalid password!'
            return reply.code(401).send({message:error})
        }
    })

    fastify.post('/signup/',{schema:signupSchema},async (request,reply) =>{
        const {username,password} = request.body;
        const {salt,hashed_password} = sha512(password,genSalt(16));
        const mongo_connect = await MongoClient.connect(mongo_url,{useUnifiedTopology: true }).catch((err)=>{request.log.info('Error while connecting to mongo db!');throw err});
        const database = await mongo_connect.db(db_name)
        const result = await database.collection('user').countDocuments({username}).catch((err)=>{request.log.info('Error while counting user collection');throw err})
        if(result==0){
            await database.collection('user').insertOne({username,salt,hashed_password}).catch((err)=>{request.log.info('Error while inserting to user collection!');throw err});  
            await mongo_connect.close();
            return reply.code(200).send();
        }
        else{
            await mongo_connect.close();
            const error = 'Username already exists!';
            return reply.code(401).send({message:error});
        }
    })
    done()
}  