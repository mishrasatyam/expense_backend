import {createHmac,randomBytes} from 'crypto'

export const db_name = 'expense'//change db name
export const mongo_url = "mongodb://localhost:27017/";

export function genSalt(length){
    return randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};

export function sha512(password, salt){
    let hash = createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    let hashed_password = hash.digest('hex');
    return {salt,hashed_password};
};

export const env = process.argv[2]=='prod'?'prod':'dev'