<script setup>
import { VueSignaturePad } from "vue-signature-pad"
import { NButton, NSpace, NTag, useMessage } from "naive-ui"

const message = useMessage()
const form = useFormStore()
const catalog = useCatalogStore()
const pad = ref()
const sending = ref(false)

const picked = computed(() => [
  ...form.model.units.map((id) => {
    const it = catalog.items.find((i) => i.id === id)
    return it ? `${it.category} ${it.assetNo}` : `#${id}`
  }),
  ...Object.entries(form.model.bulk)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => `${catalog.items.find((i) => i.id === Number(id))?.name ?? id} × ${q}`),
])

// 簽名縮到固定尺寸，減少存進資料庫的大小
const compress = (dataUrl, w = 336, h = 210) =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d").drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })

const submit = async () => {
  const { isEmpty, data } = pad.value.saveSignature()
  if (isEmpty) return message.error("請簽名")
  sending.value = true
  try {
    form.model.signature = await compress(data)
    const res = await form.submit()
    await catalog.load()
    message.success(`借用完成，單號 #${res.id}`)
  } catch (err) {
    message.error(err?.data?.message ?? "送出失敗，請重試")
  } finally {
    sending.value = false
  }
}
</script>

<template lang="pug">
.signature
  p 借用內容：
  NSpace(style="margin-bottom: 1rem;")
    NTag(v-for="p in picked" :key="p" type="info" :bordered="false") {{ p }}
  .pad
    VueSignaturePad(ref="pad" width="100%" height="220px")
  .btn
    NButton(size="large" @click="form.prev") 上一步
    NButton(size="large" @click="pad.clearSignature()") 清除
    NButton(type="primary" size="large" :loading="sending" @click="submit") 確認送出
</template>

<style lang="stylus" scoped>
.pad
  border 1px solid rgba(0,0,0,0.15)
  border-radius 0.5rem
  margin-bottom 1rem
</style>
