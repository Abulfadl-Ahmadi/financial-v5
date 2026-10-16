import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'

const FORM_MESSAGES = {
  usernameEmpty: 'Please enter your username.',
  passwordEmpty: 'Please enter your password.',
} as const

const navigate = vi.fn()
const setUserMock = vi.fn()
const setAccessTokenMock = vi.fn()
const postMock = vi.fn().mockResolvedValue({
  data: {
    access: 'mock-access-token',
    refresh: 'mock-refresh-token',
    user: {
      id: 1,
      username: 'owner',
      first_name: 'مدیر',
      last_name: 'کارگاه',
      role: 'OWNER',
    },
  },
})

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: (...args: unknown[]) => postMock(...args),
  },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setUser: setUserMock,
      setAccessToken: setAccessTokenMock,
    },
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('UserAuthForm', () => {
  describe('Rendering without redirectTo', () => {
    let screen: RenderResult
    let usernameInput: Locator
    let passwordInput: Locator
    let signInButton: Locator
    let forgotPasswordButton: Locator

    beforeEach(async () => {
      vi.clearAllMocks()
      screen = await render(<UserAuthForm />)
      usernameInput = screen.getByRole('textbox', { name: /^Username$/i })
      passwordInput = screen.getByLabelText(/^Password$/i)
      signInButton = screen.getByRole('button', { name: /^Sign in$/i })
      forgotPasswordButton = screen.getByRole('button', { name: /فراموشی رمز عبور/i })
    })

    it('renders fields, submit button, and forgot password button', async () => {
      await expect.element(usernameInput).toBeInTheDocument()
      await expect.element(passwordInput).toBeInTheDocument()
      await expect.element(signInButton).toBeInTheDocument()
      await expect.element(forgotPasswordButton).toBeInTheDocument()
    })

    it('shows validation messages when submitting empty form', async () => {
      await userEvent.click(signInButton)

      await expect
        .element(screen.getByText(FORM_MESSAGES.usernameEmpty))
        .toBeInTheDocument()
      await expect
        .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
        .toBeInTheDocument()
    })

    it('authenticates and navigates to default route on success', async () => {
      await userEvent.fill(usernameInput, 'owner')
      await userEvent.fill(passwordInput, '123456')

      await userEvent.click(signInButton)

      await vi.waitFor(() => expect(postMock).toHaveBeenCalledOnce())
      expect(postMock).toHaveBeenCalledWith('/users/login', {
        username: 'owner',
        password: '123456',
      })

      expect(setAccessTokenMock).toHaveBeenCalledWith('mock-access-token')
      expect(setUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'owner',
          role: 'OWNER',
        })
      )

      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
      )
    })
  })

  it('navigates to redirectTo when provided', async () => {
    vi.clearAllMocks()

    const { getByRole, getByLabelText } = await render(
      <UserAuthForm redirectTo='/settings' />
    )

    await userEvent.fill(getByRole('textbox', { name: /^Username$/i }), 'owner')
    await userEvent.fill(getByLabelText(/^Password$/i), '123456')

    await userEvent.click(getByRole('button', { name: /^Sign in$/i }))

    await vi.waitFor(() => expect(postMock).toHaveBeenCalledOnce())
    expect(setAccessTokenMock).toHaveBeenCalledWith('mock-access-token')

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/settings',
        replace: true,
      })
    )
  })
})
