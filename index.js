const {db} = require('./db/db.config');
const mysql = require('serverless-mysql')({config: db});
const { list, 
        paginatedList, 
        post, 
        getById, 
        deleteById, 
        putExistent, 
        putNew} = require('./repositories/customerRepository');

exports.handler = async (event, context, callback) => {
    let httpMethod = event.httpMethod;
    let id = event['pathParameters'] ?
                    (event['pathParameters']['id']?
                    event['pathParameters']['id']
                    :undefined)
                :undefined;
    let results = [];
    if(typeof id === 'undefined'){
        switch(httpMethod){
            case 'POST':
                let entity = event.body;
                results = await post(entity, mysql);
                if(results.insertId){
                    results = await getById(results.insertId, mysql);
                    context.succeed({
                                    statusCode:200, 
                                    body: JSON.stringify(results)
                    }); //Created
                }else{
                    context.succeed({statusCode: 400});
                }
                break;
            case 'GET':
                if(event['queryStringParameters']
                &&event['queryStringParameters']['page']
                &&event['queryStringParameters']['offset']){
                    let page = parseInt(event['queryStringParameters']['page']);
                    let offset = parseInt(event['queryStringParameters']['offset']);
                    results = await getPaginatedUsers(mysql, page, offset);
                    if(results.length>0){
                        context.succeed({statusCode:200, body: JSON.stringify(results)});
                    } else {
                        context.succeed({statusCode:404});
                    }
                } else {
                    results = await list(mysql);
                    if(results.length>0){
                        context.succeed({statusCode:200, body: JSON.stringify(results)});
                    } else {
                        context.succeed({statusCode:404});
                    }
                }
                break;
            default:
                context.succeed({statusCode:501});
        }
    } else {
        switch (httpMethod) {
            case 'GET':
                results = await getById(id, mysql);
                if(results.length>0){
                    context.succeed({statusCode:200, body: JSON.stringify(results)});
                } else {
                    context.succeed({statusCode:404});
                }
                break;
            case 'DELETE':
                results = await getById(userId, mysql);
                if(results.length === 0){
                    context.succeed({statusCode:404});
                }
                results = deleteById(id, mysql); 
                context.succeed({statusCode:202, body: JSON.stringify(results)}); //Acc
                break;
            case 'PUT':
                let user = await getById(id, mysql);
                if(user.length>0){
                    let entity = event.body;
                    entity = JSON.parse(entity);
                    entity.id = id;
                    results = await putExistentUser(entity, mysql);
                    if(results.changedRows !== 0){
                        results = await getById( id, mysql);
                        context.succeed({statusCode:200, body: JSON.stringify(results)}); //Ok
                    } else {
                        context.succeed({statusCode: 304});
                    }
                } else {
                    let entity = event.body;
                    entity = JSON.parse(entity);
                    entity.id = id;
                    results = await putNew(entity, mysql);
                    if(results.insertId !== 0){
                        results = await getById( results.insertId, mysql);
                        context.succeed({statusCode:201, body: JSON.stringify(results)}); //Created
                    } else {
                        context.succeed({statusCode: 304}); //Not Modified
                    }
                }
                break;
            default:
                context.succeed({statusCode:501});
        }
    }
}
