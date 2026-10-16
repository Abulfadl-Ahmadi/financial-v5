import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getPageNumbers(currentPage: number, totalPages: number) {
  const maxPagesToShow = 5
  const pages: (number | string)[] = []

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    const effectivePage = Math.min(Math.max(currentPage, 1), totalPages)

    if (effectivePage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (effectivePage >= totalPages - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = effectivePage - 1; i <= effectivePage + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    }
  }

  return pages
}

export function getDisplayNameInitials(name: string) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
