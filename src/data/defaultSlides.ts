import { IntroSlideItem } from '../types/assessment';

export const DEFAULT_SLIDE_IMAGE_KEY = '__DEFAULT_SLIDE_1__';

export const DEFAULT_INTRO_SLIDES: IntroSlideItem[] = [
  {
    id: 'slide-default-1',
    title: 'Selamat Datang di Lawan!! Nilai 100',
    description:
      'Siapkan dirimu menghadapi Asesmen Kurikulum Merdeka & TKA SMA Kelas 10 dan 11 (Bahasa Indonesia, Bahasa Inggris, dan Matematika). Baca setiap stimulus dengan teliti dan raih nilai 100 terbaikmu!',
    imageUrl: DEFAULT_SLIDE_IMAGE_KEY,
    isActive: true,
    displayMode: 'card'
  }
];
