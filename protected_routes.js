export default async function(fastify, opts, done){
    fastify.addHook('onRequest', (request, reply, done) => {
        let signed_jwt = request.cookies.jwt
        console.log(signed_jwt)
        let jwt;
        try{
            jwt = request.unsignCookie(signed_jwt)?.value;
        }catch(err){           }
        const error = 'Invalid jwt!'
        if(jwt){
            fastify.jwt.verify(jwt, (err, decoded) => {
                if (err || !decoded) {
                    fastify.log.error(error)
                    console.log('error 1',err)
                    return reply.code(401).send({error})
                }
                fastify.log.info(`jwt verified. User is ${decoded?.username}`)  
                return request.user = decoded
            })
        }else{
            console.log('error 2')
            return reply.code(401).send({error})
        }
       // console.log(request.cookies)
        done()
    })
    
    fastify.get('/expense_list/',async (request,reply) => {
        let {number,page,name,start,end} = request.query
        if(!number){number = 5}else{number=Number(number)}
        if(!page){page=1}
        page = Math.floor(page);
        const username = request.user.username
        const collection = 'expense'
        const mongo_connect = await MongoClient.connect(mongo_url,{useUnifiedTopology: true }).catch((err)=>{request.log.info("Error while connecting to mongo db!");throw err});
        const database = await mongo_connect.db(db_name)
        let query = {username}
        if(name){
            query.name = {$regex:new RegExp('^'+name,'i')}
        }
        result = await database.collection(collection).find(query).sort({_id:-1}).skip(number * page - number).limit(number).toArray().catch((err)=>{request.log.info(`Error while fetching ${collection} collection!`);throw err});  
        const total_records = await database.collection(collection).countDocuments(query);
        const page_count = Math.ceil(total_records / number);
        await mongo_connect.close();
        return reply.code(200).send({result,page_count,current_page})
    })

    fastify.post('/save_expense/',async (request,reply) => {
        const username = request.user.username
        const {name,cost,category} = request.body
        const collection = 'expense'
        const mongo_connect = await MongoClient.connect(mongo_url,{useUnifiedTopology: true }).catch((err)=>{request.log.info("Error while connecting to mongo db!");throw err});
        const database = await mongo_connect.db(db_name)
        const created_at = new Date()
        await database.collection(collection).insertOne({name,cost,category,created_at,username})
        await mongo_connect.close();
        return reply.code(200).send()
    })

    done()
}