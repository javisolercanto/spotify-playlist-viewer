import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import PlaylistView from '@/views/PlaylistView.vue';
import VoteView from '@/views/VoteView.vue';
import ResultsView from '@/views/ResultsView.vue';

const routes = [
  { path: '/', name: 'Login', component: LoginView },
  { path: '/playlist', name: 'Playlist', component: PlaylistView },
  { path: '/vote', name: 'Vote', component: VoteView },
  { path: '/results', name: 'Results', component: ResultsView },
];

const router = createRouter({
  mode: 'hash',
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
