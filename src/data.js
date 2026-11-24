import portrait from './assets/art-2.jpg'
import avatar from './assets/art-1.jpg'

// Весь текст страницы — здесь. Меняй данные, разметку трогать не нужно.
export const PROFILE = {
  name: 'Jselyx',
  handle: '@jselyx',
  role: 'Rust-разработчик',
  level: 'Jun+',
  intro: 'Пишу на Rust. Делаю мобильные приложения на Flutter и десктопные — на Tauri.',
  tags: ['rust', 'flutter', 'tauri', 'mobile', 'desktop'],
  portrait,
  avatar,
}

// Команда, в которой работаю: первый экран, карточка в проектах и подвал.
export const TEAM = {
  name: 'NoverPlay',
  role: 'Разработчик',
  url: 'https://noverplay.space',
  label: 'noverplay.space',
  about: 'Разрабатываю NoverPlay вместе с командой. Всё о проекте — на сайте.',
  tags: ['team', 'dev'],
}

export const STACK = [
  { name: 'Rust', what: 'Основной язык', note: 'Jun+', icon: 'code', color: '#ce422b' },
  { name: 'Flutter', what: 'Мобильные приложения', icon: 'phone', color: '#0175c2' },
  { name: 'Tauri', what: 'Десктопные приложения', icon: 'monitor', color: '#ffc131' },
]

export const LANGS = ['Rust', 'Dart', 'Python']

export const CONTACTS = [
  { icon: 'github', name: 'GitHub', handle: '@Jselyx', url: 'https://github.com/Jselyx', copy: 'Jselyx' },
  { icon: 'telegram', name: 'Telegram', handle: '@Accelerator3278', url: 'https://t.me/Accelerator3278', copy: '@Accelerator3278' },
]

// Проекты тянутся с GitHub в рантайме: имя, язык, звёзды и дата последнего пуша — настоящие.
// Ничего не подставляется, если запрос не прошёл: секция покажет честное «не загрузилось».
export const GITHUB_USER = 'Jselyx'
export const GITHUB_URL = 'https://github.com/Jselyx'
export const PROJECTS_LIMIT = 4

// Цвета языков — как у GitHub / официальных логотипов.
export const LANG_COLORS = {
  Rust: '#ce422b',
  Dart: '#00b4ab',
  Python: '#3776ab',
  Java: '#e76f00',
  'C++': '#00599c',
  C: '#a8b9cc',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  Shell: '#89e051',
}
