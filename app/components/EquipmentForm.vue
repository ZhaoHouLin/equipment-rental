<script setup>
import { NForm, NFormItem, NButton, NCascader, NSwitch, useMessage } from "naive-ui"
import { Html5Qrcode } from "html5-qrcode"

const message = useMessage()
const form = useFormStore()
const catalog = useCatalogStore()

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
    } else {
      await scanner?.stop()
    }
  } catch (err) {
    scanning.value = false
    message.error("無法開啟相機：" + (err?.message ?? err))
  }
}

onBeforeUnmount(() => scanner?.stop().catch(() => {}))
</script>

<template lang="pug">
NForm(label-placement="top")
  NFormItem(label="借用設備（可多選）")
    NCascader(v-model:value="form.model.units" multiple clearable placeholder="選擇設備" :options="catalog.unitOptions" check-strategy="child" :show-path="true" max-tag-count="responsive")
  NFormItem(label="掃描財編條碼")
    NSwitch(v-model:value="scanning" @update:value="toggleScan")
      template(#checked) 掃描中
      template(#unchecked) 關閉
  #scan-region(v-show="scanning")
  .btn
    NButton(@click="form.prev") 上一步
    NButton(type="primary" @click="form.next") 下一步
</template>

<style lang="stylus" scoped>
#scan-region
  width 100%
  margin-bottom 1rem
.btn
  flex(flex-end)
  gap 0.5rem
</style>
