import {
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  Users,
  Scissors,
  CreditCard,
  Receipt,
  Scroll,
  Dress,
  Command,
  GalleryVerticalEnd,
  AudioWaveform,
} from '@/components/ui/icons'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Abulfadl Admin',
      logo: Command,
      plan: 'Buisness Managment',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Employments',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Cutting',
      items: [
        {
          title: 'Cuts',
          icon: Scissors,
          url: '/cuts',
        },
      ],
    },
    {
      title: 'Financial',
      items: [
        {
          title: 'Accounts',
          url: '/accounts',
          icon: CreditCard,
        },
        {
          title: 'Receipts',
          url: '/receipts',
          icon: Receipt,
        },
      ],
    },
    {
      title: 'Inventory',
      items: [
        {
          title: 'Cloth rolls',
          icon: Scroll,
          url: 'cloth-rolls',
        },
        {
          title: 'cloths',
          url: '/cloths',
          icon: Dress,
        },
      ],
    },
  ],
}
