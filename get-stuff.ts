import { S3 } from 'aws-sdk'
import { load } from 'cheerio'

// const s3 = new S3()

// const Bucket = 'search-engine-pagebucket636ab725-1j3a6tc5qyfk1'
// const Key = decodeURIComponent('https%253A%252F%252Fwww.reddit.com%252Fr%252Fireland%252Fcomments%252Fpym3t1%252Fanyone_know_whats_going_on_here%252F')


// const getStuff = async () => {
//     const resp = await s3.getObject({
//         Bucket,
//         Key
//     }).promise()
//     const html = resp.Body?.toString('utf-8')

//     const $ = load(html ?? '')
//     $('script').remove()
//     const body = $('body')
//     const content = body.text()

//     const tokens = tokenize(content)

//     console.log(tokens)
//     console.log('-----------------')
//     console.log(content)
//     // console.log(Object.keys(tokens).length)

//     // console.log('width', tokens['width'])
// }


// getStuff()

// const tokenize = (content: string): { [token: string]: number } => {
//     const obj = {}

//     const tokens = content
//         .replace(/[^a-zA-Z]+/g, ' ')
//         .split(' ')
//         .map(t => t.trim().toLowerCase())
//         .filter(t => t.length > 3)

//     tokens.forEach(t => {
//         if (t) {
//             obj[t] = obj[t] || 0
//             obj[t] = obj[t] + 1
//         }
//     })

//     return obj
// }

export const handler = async(event) => {

    console.log(JSON.stringify(event, null, 2))

    // const TableName = process.env.TABLE ?? ''

    // if (!TableName) {
    //     throw new Error('table must be defined')
    // }

    const objects = event.Records.map(r => ({
        Key: decodeURIComponent(r.s3.object.key),
        Bucket: r.s3.bucket.name
    }))

    const s3 = new S3()

    while(objects.length > 0) {
        const obj = objects.pop()

        if (obj !== undefined) {
            const { Bucket, Key } = obj

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

                // const tokenMap = tokenize(content)

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
    }

}

const event = {
    "Records": [
        {
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "eu-west-1",
            "eventTime": "2021-10-01T00:20:30.221Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "AWS:AROA6IIQPHCE5O2PEPKVH:search-engine-fetchpagelambda1AFD0F4F-1NaEHtu7Aio2"
            },
            "requestParameters": {
                "sourceIPAddress": "34.240.133.71"
            },
            "responseElements": {
                "x-amz-request-id": "HNM2FX4EZVY7Q9CQ",
                "x-amz-id-2": "rUXwuYkI2GHo5I7xxdUtcEq8Vmc8FPeL7mpDqJZduIODhHV5ZGcbmfNaghHBKMWOdflQ0UZqXVpQyeU8+8kXdN0UxPuH5/jK"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "NzIzYTM4YTAtYTEwMC00OGRiLTliMDMtOTQ2NWRkOTZkYzk2",
                "bucket": {
                    "name": "search-engine-pagebucket636ab725-1j3a6tc5qyfk1",
                    "ownerIdentity": {
                        "principalId": "A112V7L8DJS2VN"
                    },
                    "arn": "arn:aws:s3:::search-engine-pagebucket636ab725-1j3a6tc5qyfk1"
                },
                "object": {
                    "key": "https%253A%252F%252Fwww.reddit.com%252Fr%252Fireland%252Fcomments%252Fpym3t1%252Fanyone_know_whats_going_on_here%252F",
                    "size": 718703,
                    "eTag": "fe8650b4a183e57f3c32caa8b09277aa",
                    "sequencer": "0061565454270C6984"
                }
            }
        }
    ]
}

handler(event)

/*
  remove extra whitespace and return a list of tokens
*/
// const tokenize = (content: string): { [token: string]: number } => {
//     const obj = {}
    
//     const tokens = content
//         .replace(/[^a-zA-Z]+/g, ' ')
//         .split(' ')
//         .map(t => t.trim().toLowerCase())

//     tokens.forEach(t => {
//         if (t) {
//             const current = obj[t] || 0
//             obj[t] = current + 1
//         }
//     })

//     return obj
// }
