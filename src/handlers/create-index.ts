import { S3Handler } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import { load } from 'cheerio'

// const dynamodb = new DynamoDB({
//     apiVersion: '2012-08-10',
//     region: 'eu-west-1'
// });

export const handler: S3Handler = async(event) => {

    console.log(JSON.stringify(event, null, 2))

    // const TableName = process.env.TABLE ?? ''

    // if (!TableName) {
    //     throw new Error('table must be defined')
    // }

    const obj = event.Records.map(r => ({
        Key: decodeURIComponent(r.s3.object.key),
        Bucket: r.s3.bucket.name
    }))[0]

    const s3 = new S3()


    const { Bucket, Key } = obj

    console.log('Key', Key)

    const resp = await s3.getObject({
        Bucket,
        Key
    }).promise()
    const html = resp.Body?.toString('utf-8')

    const $ = load(html ?? '')
    $('script').remove()
    const body = $('body')
    const content = body.text()

    console.log('content', content)

    const tokenMap = tokenize(content)

    console.log(tokenMap)

            // const tokens = Object.keys(tokenMap)

                // while(tokens.length > 0) {
                //     const token = tokens.pop() ?? ''
                    // console.log('token', token)
                    // console.log('count', tokenMap[token])

                    // try {
                    //     await dynamodb.updateItem({
                    //         TableName,
                    //         Key: {
                    //             token: {
                    //                 S: token
                    //             },
                    //             source: {
                    //                 S: Key
                    //             }
                    //         },
                    //         AttributeUpdates: {
                    //             count: {
                    //                 Action: 'PUT',
                    //                 Value: {
                    //                     N: tokenMap[token]?.toString() ?? '0'
                    //                 }
                    //             },
                    //             // locations: {
                    //             //     NS: ['2','3','29']
                    //             // }
                    //         }
                    //     }).promise()
                    // } catch (e) {
                    //     console.error(e)
                    //     throw (e)
                    // }
                // }



}

/*
  remove extra whitespace and return a list of tokens
*/
const tokenize = (content: string): { [token: string]: number } => {
    const obj = {}
    
    const tokens = content
        .replace(/[^a-zA-Z]+/g, ' ')
        .split(' ')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 3)

    tokens.forEach(t => {
        if (t) {
            const current = obj[t] || 0
            obj[t] = current + 1
        }
    })

    return obj
}
