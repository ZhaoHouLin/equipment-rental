<script setup>
import {
  NTabs, NTabPane, NDataTable, NTag, NButton, NSwitch, NModal, NSpace, NInput, NInputNumber, NSelect, NDynamicTags, NForm, NFormItem, useMessage, useDialog,
} from "naive-ui"

definePageMeta({ middleware: "auth" })

const message = useMessage()
const dialog = useDialog()
const admin = useAdminStore()
const catalog = useCatalogStore()

const fmt = (t) => (t ? new Date(t).toLocaleString("zh-TW", { hour12: false }) : "")
const onlyOverdue = ref(false)
const signature = ref("")

const rentalRows = computed(() => (onlyOverdue.value ? admin.rentals.filter((r) => r.overdue) : admin.rentals))
const itemLabel = (i) => (i.kind === "bulk" ? `${i.name} × ${i.qty}` : `${i.category} ${i.asset_no}`)

const confirmReturn = (row) => {
  dialog.warning({
    title: "確認歸還",
    content: `${row.name} 的借用單 #${row.id}，${row.items.map(itemLabel).join("、")}`,
    positiveText: "歸還",
    negativeText: "取消",
    onPositiveClick: async () => {
      try {
        await admin.returnRental(row.id)
        await catalog.load()
        message.success("已歸還")
      } catch (err) {
        message.error(err?.data?.message ?? "失敗")
      }
    },
  })
}

// 每欄固定寬度、不換行；表格總寬給 scroll-x，窄螢幕橫向捲動
const rentalColumns = [
  { title: "單號", key: "id", width: 80, sorter: "default" },
  { title: "單位", key: "dept", width: 110 },
  { title: "借用人", key: "name", width: 110 },
  { title: "信箱", key: "email", width: 220 },
  { title: "電話", key: "phone", width: 110 },
  { title: "借用時間", key: "borrowed_at", width: 170, render: (r) => fmt(r.borrowed_at) },
  { title: "歸還期限", key: "due_at", width: 170, render: (r) => fmt(r.due_at) },
  { title: "品項", key: "items", width: 320, render: (r) => r.items.map((i) => h(NTag, { size: "small", type: "info", bordered: false, style: "margin:2px 4px 2px 0" }, () => itemLabel(i))) },
  {
    title: "狀態", key: "status", width: 90,
    render: (r) => h(NTag, { type: r.overdue ? "error" : r.status === "已歸還" ? "success" : "warning", bordered: false }, () => (r.overdue ? "逾期" : r.status)),
  },
  { title: "簽名", key: "signature", width: 80, render: (r) => h(NButton, { size: "small", onClick: () => (signature.value = r.signature) }, () => "查看") },
  {
    title: "操作", key: "actions", width: 120,
    render: (r) => h(NButton, { size: "small", type: "primary", disabled: r.status === "已歸還", onClick: () => confirmReturn(r) }, () => (r.status === "已歸還" ? fmt(r.returned_at).slice(0, 10) : "歸還")),
  },
]
const rentalWidth = rentalColumns.reduce((s, c) => s + c.width, 0)

// 庫存
const newItem = ref({ category: "", assetNo: "", name: "", kind: "unit", total: 1 })
const kindOptions = [{ label: "單品（有財編）", value: "unit" }, { label: "配件（算數量）", value: "bulk" }]
const addItem = async () => {
  try {
    await admin.addItem(newItem.value)
    await catalog.load()
    newItem.value = { category: newItem.value.category, assetNo: "", name: "", kind: newItem.value.kind, total: 1 }
    message.success("已新增")
  } catch (err) {
    message.error(err?.data?.message ?? "失敗")
  }
}
const updateTotal = async (row, total) => {
  try {
    await admin.updateItem(row.id, { category: row.category, assetNo: row.assetNo, name: row.name, kind: row.kind, total })
    await catalog.load()
  } catch (err) {
    message.error(err?.data?.message ?? "失敗")
  }
}
const disable = (row) => {
  dialog.warning({
    title: "停用品項", content: `${row.category} ${row.assetNo} ${row.name}`, positiveText: "停用", negativeText: "取消",
    onPositiveClick: async () => {
      try { await admin.disableItem(row.id); await catalog.load(); message.success("已停用") } catch (err) { message.error(err?.data?.message ?? "失敗") }
    },
  })
}
const itemColumns = [
  { title: "類別", key: "category", width: 110, sorter: "default" },
  { title: "財編", key: "assetNo", width: 110 },
  { title: "名稱", key: "name" },
  { title: "種類", key: "kind", width: 80, render: (r) => (r.kind === "bulk" ? "配件" : "單品") },
  { title: "剩餘", key: "qty", width: 80, render: (r) => h("b", { style: r.qty ? "" : "color:#ff004c" }, r.qty) },
  { title: "總量", key: "total", width: 120, render: (r) => (r.kind === "bulk" ? h(NInputNumber, { value: r.total, min: 0, size: "small", onUpdateValue: (v) => updateTotal(r, v ?? 0) }) : r.total) },
  { title: "", key: "actions", width: 80, render: (r) => h(NButton, { size: "small", tertiary: true, type: "error", onClick: () => disable(r) }, () => "停用") },
]

// 修改紀錄
const auditColumns = [
  { title: "時間", key: "at", width: 170, render: (r) => fmt(r.at) },
  { title: "誰", key: "actor", width: 120 },
  { title: "動作", key: "action", width: 100 },
  { title: "對象", key: "target", width: 200 },
  { title: "內容", key: "detail" },
]

// 設定
const settings = ref({ orgName: "", departments: [], mailDomain: "", scanSuffixLen: 4 })
const saveSettings = async () => {
  try {
    settings.value = await admin.saveSettings(settings.value)
    await catalog.load()
    message.success("已儲存")
  } catch (err) {
    message.error(err?.data?.message ?? "失敗")
  }
}

const exportExcel = () => window.open("/api/rentals/export", "_blank")

const signatureShow = computed({
  get: () => !!signature.value,
  set: (v) => { if (!v) signature.value = "" },
})

onMounted(async () => {
  await admin.loadAll()
  settings.value = { ...catalog.settings }
})
</script>

<template lang="pug">
.management
  NTabs(type="segment" animated)
    NTabPane(name="rentals" tab="借用清單")
      NSpace(align="center" style="margin-bottom: 0.75rem;")
        NSwitch(v-model:value="onlyOverdue")
          template(#checked) 只看逾期
          template(#unchecked) 全部
        NButton(size="small" @click="exportExcel") 匯出 Excel
        span.count 共 {{ rentalRows.length }} 筆，逾期 {{ admin.rentals.filter(r => r.overdue).length }} 筆
      NDataTable(:columns="rentalColumns" :data="rentalRows" :row-key="r => r.id" :pagination="{ pageSize: 10 }" :scroll-x="rentalWidth" :single-line="false" :row-class-name="r => r.overdue ? 'overdue' : ''")
    NTabPane(name="items" tab="庫存")
      NForm(inline label-placement="left" size="small" style="margin-bottom: 0.75rem; flex-wrap: wrap;")
        NFormItem(label="類別")
          NInput(v-model:value="newItem.category" placeholder="筆電")
        NFormItem(label="財編")
          NInput(v-model:value="newItem.assetNo" placeholder="單品用")
        NFormItem(label="名稱")
          NInput(v-model:value="newItem.name" placeholder="ThinkPad")
        NFormItem(label="種類")
          NSelect(v-model:value="newItem.kind" :options="kindOptions" style="width: 150px")
        NFormItem(v-if="newItem.kind === 'bulk'" label="總量")
          NInputNumber(v-model:value="newItem.total" :min="0")
        NFormItem
          NButton(type="primary" size="small" @click="addItem") 新增品項
      NDataTable(:columns="itemColumns" :data="admin.items" :row-key="r => r.id" :pagination="{ pageSize: 10 }")
    NTabPane(name="audit" tab="修改紀錄")
      NDataTable(:columns="auditColumns" :data="admin.audit" :row-key="r => r.id" :pagination="{ pageSize: 15 }")
    NTabPane(name="settings" tab="設定")
      NForm(label-placement="left" :label-width="140" style="max-width: 640px")
        NFormItem(label="系統名稱")
          NInput(v-model:value="settings.orgName")
        NFormItem(label="單位清單")
          NDynamicTags(v-model:value="settings.departments")
        NFormItem(label="限制信箱網域")
          NInput(v-model:value="settings.mailDomain" placeholder="留空不限制，例如 example.com")
        NFormItem(label="掃描取財編末幾碼")
          NInputNumber(v-model:value="settings.scanSuffixLen" :min="1" :max="20")
        NButton(type="primary" @click="saveSettings") 儲存設定
  NModal(v-model:show="signatureShow" preset="card" title="簽名" style="width: 400px")
    img(:src="signature" style="width: 100%; background: #fff")
</template>

<style lang="stylus">
.management
  width 100%
  padding 1rem
  background-color #fff
  border-radius 1rem
  .count
    opacity 0.7
    font-size 0.9rem
  .n-data-table th, .n-data-table td
    white-space nowrap
  .n-data-table .n-button
    padding 0 12px
  .overdue td
    background-color rgba(255, 0, 76, 0.06)

@media (max-width: 640px)
  .management
    padding 0.6rem
    border-radius 0.6rem
</style>
