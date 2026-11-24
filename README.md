# Jselyx — био-страница (React + Vite)

Одностраничник: имя, стек, проекты с GitHub, контакты. Светлая и тёмная тема — по системе или кнопкой
(переключение круговой заливкой из точки нажатия). Репозитории подтягиваются с публичного GitHub API
в рантайме: в вёрстке нет захардкоженного списка проектов.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # готовый сайт в dist/
npm run preview   # посмотреть сборку
```

`dist/` можно выкладывать на GitHub Pages, Netlify или Vercel (`base: './'` уже стоит).

## Что где менять

- текст, стек, языки, контакты — `src/data.js`;
- арты — `src/assets/` (art-2 — вертикальный в арке на первом экране, art-1 — квадратный в bento);
- цвета и шрифты — переменные в начале `src/styles.css`;
- ник GitHub для блока проектов — `GITHUB_USER`, число строк — `PROJECTS_LIMIT` в `src/data.js`.

Шрифты (Unbounded, Onest) ставятся пакетами `@fontsource`, внешних запросов к Google Fonts нет.

## Перед публикацией

В `index.html` домен указан как `https://jselyx.github.io/` — замените в `canonical`, `og:url`,
`og:image`, `twitter:image` и в JSON-LD на реальный адрес, иначе превью в Telegram/Twitter
и канонический URL будут вести не туда.

`public/og.jpg` (1200×630) собран из макета `scripts/og.html`: откройте страницу при ширине окна
1200 px, снимите область 1200×630 и положите скриншот поверх `public/og.jpg`.
Иконки `icon-192`, `icon-512`, `apple-touch-icon` сделаны из `favicon.svg`.

## Как устроено

- `src/App.jsx` — разметка, темы, тосты, подсветка активного раздела, скачивание контакта `.vcf`;
- `src/useGitHub.js` — запрос к `api.github.com`, кэш в localStorage на час, честное состояние
  ошибки: секция пишет «не загрузилось» и даёт ссылку вместо выдуманных строк;
- `src/Morph.jsx` — морф форм (cookie → clover → flower → squircle) на Catmull-Rom;
- `src/Icon.jsx` — инлайновые иконки 24×24.

Анонимный лимит GitHub API — 60 запросов в час на IP, кэш на час его перекрывает.