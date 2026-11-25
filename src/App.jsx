import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Morph from './Morph.jsx'
import useGitHub from './useGitHub.js'
import useSectionSnap from './useSectionSnap.js'
import { CONTACTS, GITHUB_URL, GITHUB_USER, LANG_COLORS, LANGS, PROFILE, PRIVATE_PROJECT_STATS, PROJECTS_LIMIT, STACK, TEAM } from './data.js'

const EXT = { target: '_blank', rel: 'noopener noreferrer' }
const SECTIONS = [
  { id: 'top', label: 'Начало' },
  { id: 'projects', label: 'Проекты' },
  { id: 'stack', label: 'Стек' },
  { id: 'contacts', label: 'Контакты' },
]
const THEME_COLORS = { light: '#f4f6ee', dark: '#07080a' }

function useTheme() {
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', THEME_COLORS[theme]))
  }, [theme])
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => { try { if (!localStorage.getItem('theme')) setTheme(e.matches ? 'dark' : 'light') } catch { /* unavailable */ } }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('theme', next) } catch { /* unavailable */ }
    setTheme(next)
  }
  return [theme, toggle]
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return } catch { /* fallback */ }
  }
  const input = document.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(input)
  input.select()
  const ok = document.execCommand('copy')
  input.remove()
  if (!ok) throw new Error('copy failed')
}

function saveVCard() {
  const github = CONTACTS.find((c) => c.icon === 'github')
  const telegram = CONTACTS.find((c) => c.icon === 'telegram')
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0', 'N:;' + PROFILE.name + ';;;', 'FN:' + PROFILE.name, 'TITLE:' + PROFILE.role,
    'ORG:' + TEAM.name, github && 'URL:' + github.url, telegram && 'X-SOCIALPROFILE;TYPE=telegram:' + telegram.url, 'END:VCARD',
  ].filter(Boolean)
  const url = URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/vcard;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = PROFILE.name.toLowerCase() + '.vcf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' })
function ago(iso) {
  if (!iso) return 'недавно'
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000)
  if (!days) return 'сегодня'
  if (Math.abs(days) < 31) return rtf.format(days, 'day')
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30.4), 'month')
  return rtf.format(Math.round(days / 365), 'year')
}

function SectionHead({ id, index, tag, title, children }) {
  return (
    <div className="section-head">
      <div>
        <p className="section-tag"><span>{index}</span>{tag}</p>
        <h2 id={id}>{title}<span className="dot">.</span></h2>
      </div>
      {children}
    </div>
  )
}

function Hero() {
  return (
    <section className="snap hero" id="top" data-snap aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="kicker"><span className="status-dot" aria-hidden="true" />{PROFILE.handle} · {PROFILE.role} · {PROFILE.level}</p>
        <h1 id="hero-title">{PROFILE.name}<span className="caret" aria-hidden="true" /></h1>
        <p className="lead">{PROFILE.intro}</p>
        <a className="team-chip" href={TEAM.url} {...EXT}>
          <span className="team-label">{TEAM.role}</span>
          <strong>{TEAM.name}</strong>
          <span className="team-url">{TEAM.label} ↗</span>
        </a>
        <ul className="tags" aria-label="Направления">{PROFILE.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        <div className="hero-links">
          {CONTACTS.map((c) => (
            <a className="pill" key={c.name} href={c.url} {...EXT}><Icon n={c.icon} s={16} />{c.handle}</a>
          ))}
        </div>
      </div>
      <figure className="hero-art"><img src={PROFILE.portrait} alt="" width="540" height="960" /></figure>
      <a className="scroll-cue" href="#projects"><span className="cue-track" aria-hidden="true"><span /></span>листай вниз</a>
    </section>
  )
}

const lineCount = new Intl.NumberFormat('ru')
const pluralRules = new Intl.PluralRules('ru')
const plural = (n, one, few, many) => ({ one, few, many })[pluralRules.select(n)] || few

function RepoRow({ repo }) {
  const tone = LANG_COLORS[repo.lang]
  return (
    <li>
      <a className="m3-row sl" href={repo.url} {...EXT}>
        <span className={'tile' + (tone ? ' tone' : '')} style={tone ? { '--tone': tone } : undefined}><Icon n="repo" s={22} /></span>
        <span className="row-text">
          <span className="row-name">{repo.name}</span>
          <span className="row-sub"><i className="lang-dot" style={{ '--lang': tone || 'var(--on-surface-variant)' }} />{repo.lang || 'без языка'} · <span className="row-updated">обновлён </span>{ago(repo.pushed)}</span>
        </span>
        {repo.stars > 0 && <span className="star-badge" title={repo.stars + ' ' + plural(repo.stars, 'звезда', 'звезды', 'звёзд')}>★ {repo.stars}</span>}
        <span className="row-go" aria-hidden="true"><Icon n="arrow" s={18} /></span>
      </a>
    </li>
  )
}

function Projects() {
  const gh = useGitHub(GITHUB_USER, PROJECTS_LIMIT)
  const ready = gh.status === 'ready'
  return (
    <section className="snap section projects" id="projects" data-snap aria-labelledby="projects-title">
      <SectionHead id="projects-title" index="01" tag="работы" title="Проекты" />
      <div className="projects-grid">
        <div className="project-feature">
          <a className="team-card sl" href={TEAM.url} {...EXT}>
            <span className="team-shape" aria-hidden="true">
              <Morph shapes={['cookie', 'flower', 'sunny']} spin={0.12} hold={2400} className="team-morph" />
              <span className="team-glyph">{TEAM.name[0]}</span>
            </span>
            <span className="team-kicker">{TEAM.role} · команда</span>
            <h3>{TEAM.name}</h3>
            <p>{TEAM.about}</p>
            <span className="filled-btn">{TEAM.label}<Icon n="arrow" s={18} /></span>
          </a>
          <div className="repos-card private-project">
            <div className="card-head">
              <h3 className="title">Приватный реп</h3>
            </div>
            <ul className="group">
              {PRIVATE_PROJECT_STATS.map(({ platform, icon, lines }) => (
                <li key={platform}>
                  <div className="m3-row">
                    <span className="tile"><Icon n={icon} s={22} /></span>
                    <span className="row-text">
                      <span className="row-name">{platform}</span>
                      <span className="row-sub">{lineCount.format(lines)} {plural(lines, 'строка', 'строки', 'строк')} кода</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="sub">Android и iPhone используют общий код Flutter.</p>
          </div>
        </div>
        <div className="repos-card">
          <div className="card-head">
            <div>
              <h3 className="title">Репозитории</h3>
              <p className="sub">{ready
                ? gh.count + ' ' + plural(gh.count, 'репозиторий', 'репозитория', 'репозиториев') + ' · ' + gh.stars + ' ' + plural(gh.stars, 'звезда', 'звезды', 'звёзд')
                : 'Публичные репозитории с GitHub'}</p>
            </div>
            <a className="more sl" href={GITHUB_URL} {...EXT}>Все<Icon n="arrow" s={18} /></a>
          </div>
          {gh.status === 'loading' && <p className="sr-only" role="status">Загружаю проекты с GitHub…</p>}
          {gh.status === 'loading' && (
            <ul className="group" aria-hidden="true">
              {Array.from({ length: PROJECTS_LIMIT }, (_, i) => (
                <li key={i}><span className="m3-row is-skeleton">
                  <span className="tile skel" />
                  <span className="row-text">
                    <span className="skel skel-line" style={{ width: 30 + ((i * 13) % 30) + '%' }} />
                    <span className="skel skel-line thin" style={{ width: 45 + ((i * 17) % 25) + '%' }} />
                  </span>
                </span></li>
              ))}
            </ul>
          )}
          {gh.status === 'error' && <p className="project-message">GitHub не ответил, список не загрузился. <a href={GITHUB_URL} {...EXT}>Открыть профиль</a></p>}
          {ready && gh.repos.length === 0 && <p className="project-message">Публичных проектов пока нет.</p>}
          {ready && gh.repos.length > 0 && <ul className="group">{gh.repos.map((repo) => <RepoRow key={repo.name} repo={repo} />)}</ul>}
        </div>
      </div>
    </section>
  )
}

function Stack() {
  return (
    <section className="snap section" id="stack" data-snap aria-labelledby="stack-title">
      <SectionHead id="stack-title" index="02" tag="инструменты" title="Стек" />
      <div className="stack-layout">
        <p className="stack-copy">От идеи до продукта. Беру инструмент под задачу, а не задачу под инструмент.</p>
        <ul className="stack-grid">
          {STACK.map((item) => (
            <li className="card stack-card" key={item.name} style={{ '--tone': item.color }}>
              <span className="stack-icon"><Icon n={item.icon} s={22} /></span>
              <strong>{item.name}</strong>
              <span>{item.what}</span>
              {item.note && <small>{item.note}</small>}
            </li>
          ))}
        </ul>
      </div>
      <p className="languages">языки: {LANGS.join(' / ')}</p>
    </section>
  )
}

function Contact({ contact, notify }) {
  const copy = async () => {
    try { await copyText(contact.copy); notify('Скопировано: ' + contact.copy) }
    catch { notify('Не получилось скопировать. Выделите ник вручную') }
  }
  return (
    <li className="card contact-row">
      <a href={contact.url} {...EXT}>
        <span className="contact-icon"><Icon n={contact.icon} s={20} /></span>
        <span className="contact-text"><span>{contact.name}</span><small>{contact.handle}</small></span>
        <span className="go" aria-hidden="true">↗</span>
      </a>
      <button className="icon-button" type="button" onClick={copy} aria-label={'Скопировать ' + contact.copy} title="Скопировать"><Icon n="copy" s={18} /></button>
    </li>
  )
}

function Contacts({ notify }) {
  return (
    <section className="snap section contact-section" id="contacts" data-snap aria-labelledby="contacts-title">
      <div className="contact-main">
        <SectionHead id="contacts-title" index="03" tag="на связи" title="Давай общаться" />
        <div className="contact-layout">
          <ul className="contact-list">{CONTACTS.map((c) => <Contact key={c.name} contact={c} notify={notify} />)}</ul>
          <div className="card vcard-card">
            <p>Сохрани контакт в телефон: GitHub и Telegram сразу внутри.</p>
            <button type="button" className="pill pill-solid" onClick={saveVCard}>Сохранить .vcf <span aria-hidden="true">↓</span></button>
          </div>
        </div>
      </div>
      <footer className="footer">
        <span>{PROFILE.name.toLowerCase()} · © {new Date().getFullYear()}</span>
        <a className="footer-team" href={TEAM.url} {...EXT}>{TEAM.role.toLowerCase()} <b>{TEAM.name}</b> ↗</a>
        <nav className="footer-links" aria-label="Ссылки">
          {CONTACTS.map((c) => <a key={c.name} href={c.url} {...EXT}>{c.name.toLowerCase()}</a>)}
          <a href="#top">наверх ↑</a>
        </nav>
      </footer>
    </section>
  )
}

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [active, setActive] = useState(0)
  const [toast, setToast] = useState('')
  const timer = useRef(0)
  useSectionSnap(setActive)
  useEffect(() => () => clearTimeout(timer.current), [])
  const notify = (message) => { clearTimeout(timer.current); setToast(message); timer.current = setTimeout(() => setToast(''), 2500) }
  const dark = theme === 'dark'
  return (
    <>
      <a className="skip" href="#main">К содержимому</a>
      <div className="mesh" aria-hidden="true" style={{ '--i': active }}><span /><span /><span /><span /></div>
      <header className="header">
        <a className="brand" href="#top" aria-label={PROFILE.name + ' — наверх'}>J<span>/</span></a>
        <nav className="nav" aria-label="Разделы">
          {SECTIONS.slice(1).map((s, i) => (
            <a key={s.id} href={'#' + s.id} className={active === i + 1 ? 'is-active' : undefined} aria-current={active === i + 1 ? 'true' : undefined}>{s.label}</a>
          ))}
        </nav>
        <button type="button" className="icon-button" onClick={toggleTheme} aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'} title={dark ? 'Светлая тема' : 'Тёмная тема'}>
          <Icon n={dark ? 'sun' : 'moon'} s={18} />
        </button>
      </header>
      <nav className="rail" aria-label="Экраны">
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={'#' + s.id} className={active === i ? 'is-active' : undefined} aria-label={s.label} aria-current={active === i ? 'true' : undefined}><span /></a>
        ))}
      </nav>
      <main id="main" tabIndex={-1}>
        <Hero />
        <Projects />
        <Stack />
        <Contacts notify={notify} />
      </main>
      <div className={'toast' + (toast ? ' is-visible' : '')} role="status" aria-live="polite">{toast}</div>
    </>
  )
}
