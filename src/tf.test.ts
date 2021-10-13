import { describe, it } from 'mocha'
import { expect } from 'chai'
import { tf } from './tf'

describe('tf', () => {
    it('returns the word frequency', () => {
        const tokens = ['dog', 'name', 'foo', 'bar', 'dog', 'foo']
        const tfs = tf(tokens)
        expect(tfs.get('dog')).to.equal(2 / 6)
        expect(tfs.get('name')).to.equal(1 / 6)
        expect(tfs.get('foo')).to.equal(2 / 6)
        expect(tfs.get('bar')).to.equal(1 / 6)
        expect(tfs.get('baz')).to.equal(undefined)
    })
})
