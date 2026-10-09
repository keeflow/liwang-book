import { createRouter, createWebHashHistory } from 'vue-router'

const HomeView = () => import('@/views/HomeView.vue')
const BooksView = () => import('@/views/BooksView.vue')
const ContactsView = () => import('@/views/ContactsView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const BookFormView = () => import('@/views/BookFormView.vue')
const BookCoverView = () => import('@/views/BookCoverView.vue')
const BookDetailView = () => import('@/views/BookDetailView.vue')
const StatsView = () => import('@/views/StatsView.vue')
const ContactDetailView = () => import('@/views/ContactDetailView.vue')
const SearchView = () => import('@/views/SearchView.vue')
const PrintView = () => import('@/views/PrintView.vue')

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { tab: 'books' } },
    { path: '/books', name: 'books', component: BooksView },
    { path: '/contacts', name: 'contacts', component: ContactsView, meta: { tab: 'contacts' } },
    { path: '/me', name: 'me', component: ProfileView, meta: { tab: 'me' } },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/book/new', name: 'book-new', component: BookFormView },
    { path: '/book/:id/edit', name: 'book-edit', component: BookFormView },
    { path: '/book/:id/cover', name: 'book-cover', component: BookCoverView },
    { path: '/book/:id', name: 'book-detail', component: BookDetailView },
    { path: '/book/:id/stats', name: 'book-stats', component: StatsView },
    { path: '/book/:id/print', name: 'book-print', component: PrintView },
    { path: '/contact/:id', name: 'contact-detail', component: ContactDetailView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
