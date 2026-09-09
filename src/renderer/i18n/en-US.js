export default {
  app: {
    title: 'Dispatch Table',
    company: 'Tianxing Moving',
    edition: 'Carbon Dioxide HQ Edition © 2026'
  },
  branches: {
    全部: 'All',
    台北: 'Taipei',
    新竹: 'Hsinchu',
    高雄: 'Kaohsiung',
    總公司: 'Headquarters'
  },
  projectTypes: {
    搬工: 'Moving',
    包材: 'Packaging',
    時薪: 'Hourly'
  },
  materialPresets: {
    紙箱: 'Box',
    氣泡布: 'Bubble wrap',
    膠帶: 'Tape',
    報紙: 'Newspaper',
    棉被套: 'Quilt cover'
  },
  tabs: {
    settings: 'Settings',
    fuel: 'Fuel',
    maintenance: 'Maintenance'
  },
  actions: {
    resort: 'Re-sort',
    summary: 'Summary',
    fullSummary: 'Full Summary',
    payroll: 'Payroll',
    prevPage: 'Prev',
    nextPage: 'Next',
    undo: 'Undo',
    redo: 'Redo',
    addRow: 'Add row',
    delete: 'Delete',
    approve: 'Approve',
    reject: 'Reject',
    moveBranch: 'Move to another branch (CEO only)',
    moveBranchSaveFirst: 'Save this row first before moving it',
    addMaterial: 'Add material',
    langToggle: '中文'
  },
  columns: {
    projectType: 'Type',
    dateTime: 'Date / Time',
    namePhone: 'Name / Phone',
    inOut: 'Move in / Move out',
    unitPrice: 'Price / Rate',
    quantity: 'Trips / Hours',
    workerCount: 'Workers',
    total: 'Total',
    note: 'Note',
    materials: 'Materials'
  },
  fields: {
    date: 'Date',
    time: 'Time',
    name: 'Name',
    phone: 'Phone',
    moveIn: 'Move-in address',
    moveOut: 'Move-out address',
    note: 'Note',
    unitPrice: 'Unit price',
    trips: 'Trips',
    rate: 'Hourly rate',
    hours: 'Hours',
    workerCount: 'Workers',
    materialQuantity: 'Qty'
  },
  tax: {
    included: 'Tax incl.',
    excluded: 'No tax'
  },
  payMethod: {
    現金: 'Cash',
    月結: 'Monthly'
  },
  payStatus: {
    已付款: 'Paid',
    未付款: 'Unpaid'
  },
  filters: {
    searchDate: 'Search date',
    searchPhone: 'Search phone',
    all: 'All',
    tax: 'Tax',
    payment: 'Payment',
    clear: 'Clear',
    year: 'Year'
  },
  status: {
    saving: 'Saving…',
    saved: 'All changes saved',
    empty: 'No records on this page. Click "Add row" to start.',
    pending: 'Pending',
    complete: 'Complete',
    projectStatusHint: 'Payroll settlement status from the driver app (read-only)'
  },
  confirm: {
    unsavedTitle: 'Unsaved changes',
    unsavedBody: 'You have unsaved changes that will be lost if you leave.'
  },
  validation: {
    materialsRequiredForPackaging: 'At least one material is required for Packaging rows — please add one before saving'
  },
  auth: {
    title: 'Sign in',
    subtitle: 'Tianxing Moving · Dispatch System',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    logout: 'Log out',
    invalidCredentials: 'Incorrect email or password',
    demoLabel: 'Demo accounts (click to fill)',
    demoPassword: 'Password for all:'
  },
  profile: {
    title: 'Profile & Settings',
    back: 'Back to Dispatch',
    accountSection: 'Account Settings',
    email: 'Email',
    password: 'New Password',
    confirmPassword: 'Confirm New Password',
    currentPassword: 'Current Password',
    saveBtn: 'Save Settings',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Leave empty to keep unchanged',
    confirmPasswordPlaceholder: 'Re-enter new password',
    currentPasswordPlaceholder: 'Required to confirm changes',
    settingsSection: 'System Settings',
    theme: 'Theme',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    successMsg: 'Settings saved successfully!',
    passwordsMismatch: 'Passwords do not match',
    emailTaken: 'This email is already in use',
    emptyEmail: 'Email cannot be empty',
    wrongCurrentPassword: 'Incorrect current password',
    notSupported: 'This action is not supported yet',
    yearSelectTitle: 'Select Year',
    yearSelectSubtitle: 'Please select the year you want to manage',
    textSize: 'Text size',
    textSizeSmall: 'Small',
    textSizeDefault: 'Default',
    textSizeLarge: 'Large',
    textSizeExtraLarge: 'Extra Large',
    supportSection: 'Help & Feedback',
    helpCenter: 'Help Center',
    helpCenterSub: 'FAQ and operational guides',
    contactUs: 'Contact Us',
    contactUsSub: 'Get technical assistance',
    reportProblem: 'Report a Problem',
    reportProblemSub: 'Send bugs and system feedback',
    aboutSection: 'About App',
    aboutUs: 'About Us',
    aboutUsSub: 'Application information and mission',
    terms: 'Terms & Privacy',
    termsSub: 'Policies and offline storage guidelines',
    rateUs: 'Rate App',
    rateUsSub: 'Help us improve the utility',
    version: 'Version',
    versionSub: 'Production builds indicator',
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',
    deleteAccountSub: 'Permanently deactivate your account and remove access',
    deleteConfirmTitle: 'Confirm Deletion',
    deleteConfirmBody: 'Are you sure you want to permanently delete this account? This action cannot be undone.',
    deleteConfirmYes: 'Delete',
    deleteConfirmNo: 'Cancel',
    supportHelpText: 'Tianxing Dispatch Help:\n1. Edit Data: Directly type inside grid cells to update them.\n2. Branches: Toggle branch tabs above to manage Taipei/Hsinchu/Kaohsiung operations.\n3. Saving: Changes save automatically. Use Undo/Redo (or Ctrl/Cmd+Z) in the top right to step back through edits made this session.',
    supportContactText: 'For system technical support, contact us at:\nEmail: support@fyf.com.tw\nPhone: 0982-115-727',
    aboutUsText: 'Tianxing Moving Dispatch Management (v0.1.4) supports cross-platform log scheduling, instant statistics, branch filters, and automated payroll calculations.',
    termsText: 'Privacy Statement: All dispatch schedule records are saved in your local SQLite file and never transmitted to external cloud systems.',
    problemReportedAlert: 'Report submitted successfully! Thank you for your feedback.',
    rateUsAlert: 'Thank you for your rating! You rated {stars} stars.',
    reportPlaceholder: 'Please describe the problem you encountered or your feedback, we will handle it as soon as possible...',
    reportSubmit: 'Submit Report',
    langSelect: 'Language'
  },
  maintenance: {
    title: 'Vehicle Maintenance Requests',
    back: 'Back to Dispatch',
    columns: {
      dateTime: 'Date',
      driverName: 'Driver',
      address: 'Location',
      amount: 'Amount',
      note: 'Note',
      receipt: 'Receipt',
      status: 'Status'
    },
    fields: {
      selectDriver: 'Select driver…',
      address: 'Location',
      note: 'Note'
    },
    receiptLink: 'View Receipt',
    noReceipt: '—'
  },
  salary: {
    title: 'Payroll',
    back: 'Back to Dispatch',
    total: 'Total Payroll',
    assignWorkers: 'Assign Workers',
    noWorkers: 'No workers in this branch yet',
    noRecords: 'No payroll records yet.',
    columns: {
      worker: 'Worker',
      role: 'Role',
      amount: 'Amount'
    },
    roles: {
      manager: 'Manager',
      driver: 'Driver',
      assistant: 'Assistant'
    }
  },
  fuel: {
    title: 'Fuel Requests',
    back: 'Back to Dispatch',
    columns: {
      dateTime: 'Date',
      driverName: 'Driver',
      reportedAmount: 'Reported Amount',
      approvedAmount: 'Approved Amount',
      status: 'Status'
    },
    fields: {
      selectDriver: 'Select driver…',
      reportedAmount: 'Reported amount',
      approvedAmount: 'Approved amount'
    }
  },
  requestStatus: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  },
  export: {
    selectMonthTitle: 'Select month to export',
    selectYear: 'Year',
    selectMonth: 'Month',
    confirm: 'Download',
    cancel: 'Cancel',
    downloading: 'Exporting…',
    error: 'Export failed, please try again',
    empty: 'No data to export'
  }
}
