export default {
  app: {
    title: '出車表',
    company: '天興搬家',
    edition: '二氧化碳 總公司版 © 2026'
  },
  branches: {
    全部: '全部',
    台北: '台北',
    新竹: '新竹',
    高雄: '高雄',
    總公司: '總公司'
  },
  projectTypes: {
    搬工: '搬工',
    包材: '包材',
    時薪: '時薪'
  },
  materialPresets: {
    紙箱: '紙箱',
    氣泡布: '氣泡布',
    膠帶: '膠帶',
    報紙: '報紙',
    棉被套: '棉被套'
  },
  tabs: {
    settings: '設定',
    fuel: '油資',
    maintenance: '保養'
  },
  actions: {
    resort: '重排',
    summary: '總表',
    fullSummary: '全總表',
    payroll: '薪資結算',
    prevPage: '上頁',
    nextPage: '下頁',
    undo: '復原',
    redo: '重做',
    addRow: '新增一筆',
    delete: '刪除',
    approve: '核准',
    reject: '拒絕',
    moveBranch: '搬移至其他分公司（僅限 CEO）',
    moveBranchSaveFirst: '請先儲存此筆資料才能搬移',
    addMaterial: '新增材料',
    langToggle: 'EN'
  },
  columns: {
    projectType: '種類',
    dateTime: '日期 / 時間',
    namePhone: '名稱 / 電話',
    inOut: '搬入 / 搬出',
    unitPrice: '單價 / 時薪',
    quantity: '趟 / 工時',
    workerCount: '工人數',
    total: '總價',
    note: '備註',
    materials: '材料'
  },
  fields: {
    date: '日期',
    time: '時間',
    name: '名稱',
    phone: '電話',
    moveIn: '搬入地址',
    moveOut: '搬出地址',
    note: '備註',
    unitPrice: '單價',
    trips: '趟',
    rate: '時薪',
    hours: '工時',
    workerCount: '工人數',
    materialQuantity: '數量'
  },
  tax: {
    included: '含稅',
    excluded: '未稅'
  },
  payMethod: {
    現金: '現金',
    月結: '月結'
  },
  payStatus: {
    已付款: '已付款',
    未付款: '未付款'
  },
  filters: {
    searchDate: '搜尋日期',
    searchPhone: '搜尋電話',
    all: '全部',
    tax: '稅別',
    payment: '付款',
    clear: '清除',
    year: '年度'
  },
  status: {
    saving: '儲存中…',
    saved: '所有變更已儲存',
    empty: '本頁沒有資料，點「新增一筆」開始建立。',
    pending: '待處理',
    complete: '已完成',
    projectStatusHint: '來自司機端 App 的薪資結算狀態（唯讀）'
  },
  confirm: {
    unsavedTitle: '尚未儲存',
    unsavedBody: '有未儲存的變更，離開將會遺失。'
  },
  validation: {
    materialsRequiredForPackaging: '包材項目至少需要新增一筆材料，請填寫後再儲存'
  },
  auth: {
    title: '登入',
    subtitle: '天興搬家 · 派車系統',
    email: '電子郵件',
    password: '密碼',
    emailPlaceholder: '請輸入電子郵件',
    passwordPlaceholder: '請輸入密碼',
    signIn: '登入',
    signingIn: '登入中…',
    logout: '登出',
    invalidCredentials: '電子郵件或密碼錯誤',
    demoLabel: '測試帳號（點選自動帶入）',
    demoPassword: '密碼皆為'
  },
  profile: {
    title: '個人檔案與設定',
    back: '返回出車表',
    accountSection: '帳號設定',
    email: '電子郵件',
    password: '新密碼',
    confirmPassword: '確認新密碼',
    currentPassword: '目前密碼',
    saveBtn: '儲存設定',
    emailPlaceholder: '請輸入電子郵件',
    passwordPlaceholder: '不變更請留空',
    confirmPasswordPlaceholder: '請再次輸入新密碼',
    currentPasswordPlaceholder: '確認變更請輸入目前密碼',
    settingsSection: '系統設定',
    theme: '佈景主題',
    themeLight: '淺色模式',
    themeDark: '深色模式',
    successMsg: '設定已成功儲存！',
    passwordsMismatch: '密碼不一致',
    emailTaken: '此電子郵件已被其他帳號使用',
    emptyEmail: '電子郵件不能為空',
    wrongCurrentPassword: '目前密碼不正確',
    notSupported: '此帳號功能暫不支援',
    yearSelectTitle: '選擇工作年度',
    yearSelectSubtitle: '請選擇您要管理的派車資料年份',
    textSize: '字體大小',
    textSizeSmall: '小',
    textSizeDefault: '標準',
    textSizeLarge: '大',
    textSizeExtraLarge: '特大',
    supportSection: '幫助與回饋',
    helpCenter: '說明中心',
    helpCenterSub: '常見問題與操作指南',
    contactUs: '聯絡我們',
    contactUsSub: '獲取系統技術支援',
    reportProblem: '回報問題',
    reportProblemSub: '回報錯誤與系統反饋',
    aboutSection: '關於軟體',
    aboutUs: '關於我們',
    aboutUsSub: '軟體資訊與開發宗旨',
    terms: '服務條款與隱私權',
    termsSub: '服務政策與本地端儲存說明',
    rateUs: '評價軟體',
    rateUsSub: '幫助我們改進系統',
    version: '版本資訊',
    versionSub: '正式發行版本標識',
    dangerZone: '危險區域',
    deleteAccount: '刪除帳號',
    deleteAccountSub: '永久停用此帳號並移除所有存取權限',
    deleteConfirmTitle: '確認刪除',
    deleteConfirmBody: '您確定要永久刪除此帳號嗎？此操作將無法復原。',
    deleteConfirmYes: '確認刪除',
    deleteConfirmNo: '取消',
    supportHelpText: '天興派車說明：\n1. 編輯資料：直接於表格內輸入即可更新。\n2. 管理分公司：切換上方分公司頁籤即可管理臺北/新竹/高雄資料。\n3. 儲存變更：系統會自動儲存所有變更。可使用右上角「復原／重做」按鈕（或 Ctrl/Cmd+Z）回到本次操作中的先前狀態。',
    supportContactText: '如需系統技術支援，請聯繫：\nEmail: support@fyf.com.tw\n電話: 0982-115-727',
    aboutUsText: '天興搬家出車表系統 (v0.1.4) 提供跨平台派車管理、即時統計結算、分公司報表切換及自動化薪資結算等核心功能。',
    termsText: '隱私說明：本系統所有出車資料及設定皆儲存於您本機的 SQLite 資料庫中，絕不自動傳輸至外部伺服器。',
    problemReportedAlert: '問題已成功回報！感謝您的反饋。',
    rateUsAlert: '感謝您的評價！您評分了 {stars} 顆星。',
    reportPlaceholder: '請詳細描述您遇到的問題或反饋，我們將會盡快處理...',
    reportSubmit: '送出回報',
    langSelect: '顯示語言'
  },
  maintenance: {
    title: '車輛保養申請',
    back: '返回出車表',
    columns: {
      dateTime: '日期',
      driverName: '司機',
      address: '地點',
      amount: '金額',
      note: '備註',
      receipt: '收據',
      status: '狀態'
    },
    fields: {
      selectDriver: '選擇司機…',
      address: '地點',
      note: '備註'
    },
    receiptLink: '查看收據',
    noReceipt: '—'
  },
  salary: {
    title: '薪資結算',
    back: '返回出車表',
    total: '薪資總支出',
    assignWorkers: '指派工作人員',
    noWorkers: '此分公司尚無工作人員',
    noRecords: '目前尚無薪資紀錄。',
    columns: {
      date: '日期 / 時間',
      worker: '人員',
      role: '職位',
      project: '項目',
      amount: '金額'
    },
    roles: {
      manager: '管理員',
      driver: '司機',
      assistant: '助理'
    },
    filters: {
      searchProject: '搜尋項目',
      worker: '人員',
      allWorkers: '全部人員',
      from: '起始日',
      to: '結束日'
    }
  },
  fuel: {
    title: '油資申請',
    back: '返回出車表',
    columns: {
      dateTime: '日期',
      driverName: '司機',
      reportedAmount: '回報金額',
      approvedAmount: '核准金額',
      status: '狀態'
    },
    fields: {
      selectDriver: '選擇司機…',
      reportedAmount: '回報金額',
      approvedAmount: '核准金額'
    }
  },
  requestStatus: {
    pending: '待審核',
    approved: '已核准',
    rejected: '已拒絕'
  },
  export: {
    selectMonthTitle: '選擇匯出月份',
    selectYear: '年度',
    selectMonth: '月份',
    confirm: '下載',
    cancel: '取消',
    downloading: '匯出中…',
    error: '匯出失敗，請稍後再試',
    empty: '沒有可匯出的資料'
  }
}
