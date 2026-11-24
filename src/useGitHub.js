import { useEffect, useState } from 'react'

// Тянем репозитории с публичного GitHub API: без токена, 60 запросов в час на IP.
// Ответ кэшируем в localStorage на час, чтобы анонимный лимит не выгорал при каждом заходе.
const TTL = 60 * 60 * 1000
const cacheKey = (user) => 'gh-repos:v2:' + user

function readCache(user) {
  try {
    const raw = localStorage.getItem(cacheKey(user))
    if (!raw) return null
    const hit = JSON.parse(raw)
    if (!hit || typeof hit.at !== 'number' || Date.now() - hit.at > TTL) return null
    return hit.data
  } catch {
    return null
  }
}

function writeCache(user, data) {
  try {
    localStorage.setItem(cacheKey(user), JSON.stringify({ at: Date.now(), data }))
  } catch {
    // приватный режим — просто не кэшируем
  }
}

function normalize(list, limit) {
  return list
    .filter((r) => r && !r.fork && !r.archived)
    .map((r) => ({
      name: r.name,
      description: r.description || '',
      url: r.html_url,
      lang: r.language || null,
      stars: r.stargazers_count || 0,
      pushed: r.pushed_at || r.updated_at,
    }))
    .sort((a, b) => b.stars - a.stars || new Date(b.pushed) - new Date(a.pushed))
    .slice(0, limit)
}

export default function useGitHub(user, limit = 4) {
  const [state, setState] = useState({ status: 'loading', repos: [], count: 0, stars: 0 })

  useEffect(() => {
    const cached = readCache(user)
    if (cached) {
      setState({ status: 'ready', ...cached })
      return undefined
    }

    const ac = new AbortController()
    const get = (url) =>
      fetch(url, { signal: ac.signal, headers: { Accept: 'application/vnd.github+json' } }).then((r) =>
        r.ok ? r.json() : null,
      )

    Promise.all([
      get('https://api.github.com/users/' + encodeURIComponent(user)),
      get('https://api.github.com/users/' + encodeURIComponent(user) + '/repos?per_page=100&sort=pushed'),
    ])
      .then(([profile, repos]) => {
        if (!Array.isArray(repos)) {
          setState({ status: 'error', repos: [], count: 0, stars: 0 })
          return
        }
        const data = {
          repos: normalize(repos, limit),
          count: profile && Number.isFinite(profile.public_repos) ? profile.public_repos : repos.length,
          stars: repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0),
        }
        setState({ status: 'ready', ...data })
        writeCache(user, data)
      })
      .catch((err) => {
        if (err && err.name === 'AbortError') return // размонтирование / StrictMode
        setState({ status: 'error', repos: [], count: 0, stars: 0 })
      })

    return () => ac.abort()
  }, [user, limit])

  return state
}