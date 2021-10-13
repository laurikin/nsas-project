
export const tf = (tokens: string[]): Map<string,number> => {
    const freqs: Map<string, number> = new Map()
    const n = tokens.length

    tokens.forEach(token => {
        const count = freqs.get(token) ?? 0
        freqs.set(token, count + 1)
    })

    freqs.forEach((value, key) => {
        freqs.set(key, value / n)
    })

    return freqs
}
