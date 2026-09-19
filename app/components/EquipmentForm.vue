<script setup>
import { NForm, NFormItem, NButton, NCheckbox, NCheckboxGroup, NSwitch, NSpace, useMessage } from "naive-ui"
import { Html5Qrcode } from "html5-qrcode"

const message = useMessage()
const form = useFormStore()
const catalog = useCatalogStore()

// 類別 → 單品清單，全部攤開用核取方塊，沒有彈出選單
const groups = computed(() => {
  const m = new Map()
  for (const it of catalog.unitItems) {
    if (!m.has(it.category)) m.set(it.category, [])
    m.get(it.category).push(it)
  }
  return [...m].map(([category, items]) => ({ category, items }))
})

const scanning = ref(false)
let scanner = null

// 掃到條碼／QR：取財編末幾碼比對單品，可借且未重複就加入
const onScan = (text) => {
  const item = catalog.findByAssetSuffix(text)
  if (!item) return message.warning(`找不到財編 …${String(text).slice(-catalog.settings.scanSuffixLen)}`)
  if (item.qty < 1) return message.error(`${item.category} ${item.assetNo} 已被借出`)
  if (form.model.units.includes(item.id)) return
  form.model.units.push(item.id)
  message.success(`已加入 ${item.category} ${item.assetNo}`)
}

const toggleScan = async (on) => {
  try {
    if (on) {
      scanner ??= new Html5Qrcode("scan-region")
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 200, height: 200 } }, onScan)
    } else if (scanner?.isScanning) {
      await scanner.stop()
    }
  } catch (err) {
    scanning.value = false
    message.error("無法開啟相機：" + (err?.message ?? err))
  }
}

onBeforeUnmount(() => {
  if (scanner?.isScanning) scanner.stop().catch(() => {})
})
</script>

<template lang="pug">
NForm(label-placement="top")
  NFormItem(label="借用設備（可多選）")
    .groups
      NCheckboxGroup(v-model:value="form.model.units")
        .group(v-for="g in groups" :key="g.category")
          h4 {{ g.category }}
          NSpace(:size="[12, 8]")
            NCheckbox(v-for="it in g.items" :key="it.id" :value="it.id" :disabled="it.qty < 1" :label="`${it.assetNo} ${it.name}`.trim() + (it.qty < 1 ? '（已借出）' : '')")
      p.hint(v-if="!groups.length") 目前沒有可借的設備。
  NFormItem(label="掃描財編條碼")
    NSwitch(v-model:value="scanning" @update:value="toggleScan")
      template(#checked) 掃描中
      template(#unchecked) 關閉
  #scan-region(v-show="scanning")
  .btn
    NButton(size="large" @click="form.prev") 上一步
    NButton(type="primary" size="large" @click="form.next") 下一步
</template>

<style lang="stylus" scoped>
.groups
  width 100%
  max-height 300px
  overflow-y auto
  padding 0.25rem 0.5rem
  border 1px solid rgba(0,0,0,0.1)
  border-radius 0.5rem
  .group
    margin-bottom 0.75rem
    h4
      margin 0.25rem 0 0.4rem
      color color_secondary
.hint
  opacity 0.7
#scan-region
  width 100%
  margin-bottom 1rem
</style>
