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
  UserCog,
} from '@/components/ui/icons'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Workshop Owner',
    email: 'admin@garment-workshop.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Garment ERP Workshop',
      logo: Command,
      plan: 'Workshop Management',
    },
    {
      name: 'Cutting & Sewing Unit',
      logo: GalleryVerticalEnd,
      plan: 'Production Floor',
    },
    {
      name: 'Financial & Accounts',
      logo: AudioWaveform,
      plan: 'Cashflow & Profit',
    },
  ],
  navGroups: [
    {
      title: 'Workshop Management',
      items: [
        {
          title: 'Executive Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Workforce & Tailors',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Team Communications',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
      ],
    },
    {
      title: 'Production & Sewing',
      items: [
        {
          title: 'Cutting Orders',
          url: '/cuts',
          icon: Scissors,
        },
        {
          title: 'Sewing Operations & Tasks',
          url: '/tasks',
          icon: ListTodo,
        },
      ],
    },
    {
      title: 'Financial & Accounting',
      items: [
        {
          title: 'Bank Accounts',
          url: '/accounts',
          icon: CreditCard,
        },
        {
          title: 'Receipts & Cashflow',
          url: '/receipts',
          icon: Receipt,
        },
        {
          title: 'Workshop Expenses',
          url: '/expenses',
          icon: Receipt,
        },
        {
          title: 'Bank Reconciliation (مغایرت‌گیری بانکی)',
          url: '/reconciliation',
          icon: Receipt,
        },
      ],
    },
    {
      title: 'Warehouse & Inventory',
      items: [
        {
          title: 'Fabric Rolls (طاقه‌ها)',
          url: '/cloth-rolls',
          icon: Scroll,
        },
        {
          title: 'Garments & Styles',
          url: '/cloths',
          icon: Dress,
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Settings',
          icon: UserCog,
          items: [
            {
              title: 'Profile',
              url: '/settings',
            },
            {
              title: 'Account',
              url: '/settings/account',
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
            },
            {
              title: 'Display',
              url: '/settings/display',
            },
          ],
        },
      ],
    },
  ],
}
