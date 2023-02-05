const ORIGIN = 'https://redblacktest.link'

function smartify(string) {
    const cache = JSON.parse(localStorage.getItem('smartify-cache') || '{}')
    return Promise.all(string.split('\n').map(line => {
        if (line.startsWith('[')) {
            return new Promise((resolve, _) => resolve(line))
        }
        return Promise.all(line.split(' ').map(token => {
            const match = token.match(/\w+/)
            if (!match) {
                return new Promise((resolve, _) => resolve(token))
            }
            const word = match[0]
            if (word.length > 4 && Math.random() < 0.4) {
                const randomSynonym = getSynonymsWithCache(word, cache).then(synonyms => {
                    if (!synonyms) {
                        return token
                    }
                    const smartSynonyms = synonyms.filter(w => w.length > 7)
                    if (smartSynonyms.length === 0) {
                        return token
                    } else {
                        const randomIndex = Math.floor(Math.random() * smartSynonyms.length)
                        return `<b><i style="color: red">${token.replace(word, smartSynonyms[randomIndex])}</i></b>`
                    }
                })
                return randomSynonym
            }
            return new Promise((resolve, _) => resolve(token))
        })).then(wordResults => {
            localStorage.setItem('smartify-cache', JSON.stringify(cache))
            return wordResults.join(' ')
        })
    })).then((lineResults) => {
        return lineResults.join('\n')
    })
}

function present(string) {
    const lines = string.split('\n')
    const prettyLines = []
    let i = 0
    for (const li in lines) {
        const line = lines[li]
        if (line.replace(/\s/, '').length === 0) {
            prettyLines.push(line)
        }
        else {
            prettyLines.push(`<p style="display: inline; color: grey; opacity: 0.8">${++i}</p>: ${line}`)
        }
    }
    return (
        prettyLines
            .join('\n')
            .trimStart()
            .replace(/\n/g, '<br/>')
    )
}

function getSong(query) {
    return (
        fetch(`${ORIGIN}/bestGuess?` + new URLSearchParams({ 'q': query }))
            .then(response => {
                return response.json()
            }).catch(console.error)
    )
}

function getSynonymsWithCache(word, cache) {
    if (cache[word] === undefined) {
        return (
            getSynonyms(word)
                .then(synonyms => {
                    cache[word] = synonyms
                    return cache[word]
                })
                .catch(err => {
                    cache[word] = []
                })
        )
    } else {
        return new Promise((resolve, _) => resolve(cache[word]))
    }
}

function getSynonyms(word) {
    return fetch(`${ORIGIN}/synonyms?` + new URLSearchParams({ 'word': word }))
        .then(response => {
            if (response.ok) {
                return response.json()
            }
            else {
                throw new Error('did not find synonyms for word')
            }
        })
}

function isDisabled() {
    return (
        document.getElementById('query').value === ''
    )
}

document.getElementById('before').innerHTML = 'Loading...'
document.getElementById('after').innerHTML = 'Just a sec...'
const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get('query')
if (query) {
    getSong(query)
        .then(song => {
            const lyrics = song.song
            document.getElementById('before').innerHTML = present(lyrics)
            document.getElementById('song-name').innerHTML = song.songName
            document.getElementById('artist').innerHTML = song.artist
            smartify(lyrics).then(smarterLyrics => {
                document.getElementById('after').innerHTML = present(smarterLyrics)
                document.getElementById('search-form').removeAttribute('hidden')
                document.getElementById('button-sub').removeAttribute('hidden')
                document.getElementById('version').removeAttribute('hidden')
            }).catch(err => {
                document.getElementById('before').innerHTML = 'Please try again, or try another song.'
                document.getElementById('after').innerHTML = '...'
                document.getElementById('search-form').removeAttribute('hidden')
                document.getElementById('button-sub').setAttribute('hidden', true)
                document.getElementById('version').setAttribute('hidden', true)
                alert('there was an error in making your lyrics smarter')
            })
        })
        .catch(err => {
            document.getElementById('before').innerHTML = 'Please try another song.'
            document.getElementById('after').innerHTML = '...'
            document.getElementById('search-form').removeAttribute('hidden')
            document.getElementById('button-sub').setAttribute('hidden', true)
            document.getElementById('version').setAttribute('hidden', true)
            alert('did not find song')
        })
}
else {
    alert('enter a song name!')
    document.getElementById('before').innerHTML = 'Please enter a song name.'
    document.getElementById('after').innerHTML = '...'
    document.getElementById('search-form').removeAttribute('hidden')
}


//styling based on javascript variables
var smart = false
document.getElementById('version').innerHTML = (smart ? 'After' : 'Before')

function toggleVersion() {
    smart = !smart
    const panels = document.getElementsByClassName('panel')
    if (smart) {
        panels[0].setAttribute('active', false)
        panels[1].setAttribute('active', true)
        document.getElementById('version').innerHTML = 'After'
    } else {
        panels[0].setAttribute('active', true)
        panels[1].setAttribute('active', false)
        document.getElementById('version').innerHTML = 'Before'
    }
}

toggleVersion()