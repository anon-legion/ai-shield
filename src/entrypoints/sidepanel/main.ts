import { mount } from 'svelte';
import '@/assets/tailwind.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('sidepanel mount target #app not found');

const app = mount(App, { target });

export default app;
