import { describe, it } from 'mocha'
import { expect } from 'chai'
import { tokenize } from './tokenize'

describe('tokenize', () => {
    it('splits stems and removes stopwords 1', () => {
        const tokens = tokenize(`What's your dogs name?`)
        expect(tokens).to.deep.equal(['dog', 'name'])
    })

    it('splits stems and removes stopwords 2', () => {
        const tokens = tokenize(`What are you gonna do tomorrow?`)
        expect(tokens).to.deep.equal(['tomorrow'])
    })

    it('splits stems and removes stopwords 3', () => {
        const tokens = tokenize(`I heard you were going to the movies on Saturday Saturdays`)
        expect(tokens).to.deep.equal(['heard', 'go', 'movi', 'saturdai', 'saturdai'])
    })
})
