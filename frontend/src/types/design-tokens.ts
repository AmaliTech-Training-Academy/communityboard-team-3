export const designTokens = {
  colors: {
    primary: '#08283b',
    surface: '#fdfdfd',
    surfaceOverlay: '#ececeb',
    textPrimary: '#041620',
    textSecondary: '#395362',
    textMuted: '#5a6f7c',
    textSubtle: '#adadad',
    borderDefault: '#e6eaeb',
    borderStrong: '#b2bcc2',
    success: '#046c4e',
    successBackground: '#def7ec',
    danger: '#c81e1e',
    dangerBackground: '#fde8e8',
    chipEventBackground: '#edebfe',
    chipEventBorder: '#ac94fa',
    chipEventText: '#5521b5',
    navbarFieldBackground: '#f0f3f4',
    navbarText: '#5f6367',
    navbarLock: '#9aa0a6',
  },
  typography: {
    family: {
      sans: 'Inter, sans-serif',
    },
    size: {
      sm: 14,
      base: 16,
      xl: 20,
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
    },
  },
  spacing: {
    0: 0,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
  },
  radius: {
    md: 6,
    lg: 8,
    xl: 14,
    pill: 21,
  },
  shadows: {
    sm: '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
  },
  breakpoints: {
    // inferred from frame sizes in provided designs
    mobile: 393,
    desktop: 1440,
  },
  components: {
    button: {
      bg: '#08283b',
      text: '#fdfdfd',
      radius: 8,
      px: 20,
      py: 10,
    },
    input: {
      label: '#08283b',
      bg: '#ececeb',
      border: '#b2bcc2',
      placeholder: '#5a6f7c',
      radius: 8,
      px: 16,
      py: 12,
      errorBg: '#fde8e8',
      errorBorder: '#c81e1e',
      errorText: '#c81e1e',
    },
    card: {
      bg: '#fdfdfd',
      border: '#e6eaeb',
      radius: 14,
      title: '#041620',
      body: '#395362',
      meta: '#5a6f7c',
      chipEventBg: '#edebfe',
      chipEventBorder: '#ac94fa',
      chipEventText: '#5521b5',
    },
    navbar: {
      bg: '#ffffff',
      fieldBg: '#f0f3f4',
      text: '#5f6367',
      muted: '#adadad',
      lock: '#9aa0a6',
    },
    toastSuccess: {
      bg: '#def7ec',
      icon: '#046c4e',
      text: '#046c4e',
      shadow:
        '0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)',
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
