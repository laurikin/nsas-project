import { Handler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import { uniq } from 'lodash'
import { tokenize } from '../tokenize'

interface IEvent {
    text?: string
}

export const handler: Handler<IEvent> = async({ text }) => {
    const dynamodb = new DynamoDB()
    const TableName = process.env.TABLE ?? ''

    if (!TableName) {
        throw new Error('table must be defined')
    }

    if (!text) {
        throw new Error('text must be defined')
    }

    const tokens = uniq(tokenize(text)).slice(0, 100)

    const results: { [doc: string]: number [] } = {}
    
    while (tokens.length > 0) {
        const token = tokens.pop()

        if (token) {

            const res = await dynamodb.query({
                TableName,
                KeyConditionExpression: `keyword = :searchterm`,
                Limit: 100,
                ExpressionAttributeValues: {
                    ':searchterm': { 'S': token }
                }
            }).promise()

            console.log(JSON.stringify(res.Items))

            res.Items?.forEach(item => {
                const doc = decodeURIComponent(item?.document?.S ?? '')
                const tf = parseFloat(item?.count?.N ?? '0') 
                
                results[doc] = results[doc] ?? []
                results[doc].push(tf)
            })

        }
    }

    const rank: { doc: string, score: number }[] = Object.keys(results)
        .map(doc => {
            const scores = results[doc]
            const sum = scores.reduce((sum, score) => sum + score, 0)
            return {
                doc,
                score: sum
            }
        })

    rank.sort((a, b) => b.score - a.score)

    return rank.map(i => {
        return `${i.doc}: ${i.score}`
    }).join('\n')
}
