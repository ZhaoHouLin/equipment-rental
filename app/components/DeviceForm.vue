<script setup>
import { NForm, NFormItem, NButton, NInputNumber, useMessage } from "naive-ui"

const message = useMessage()
const form = useFormStore()
const catalog = useCatalogStore()
const isMobile = useIsMobile()

const next = () => {
  const hasBulk = Object.values(form.model.bulk).some((q) => q > 0)
  if (!form.model.units.length && !hasBulk) return message.error("請至少選一項設備或配件")
  form.next()
}
</script>

<template lang="pug">
NForm(:label-placement="isMobile ? 'top' : 'left'" :label-width="130")
  p.hint(v-if="!catalog.bulkItems.length") 目前沒有可借的配件。
  NFormItem(v-for="it in catalog.bulkItems" :key="it.id" :label="it.name")
    NInputNumber(:value="form.model.bulk[it.id] ?? 0" :min="0" :max="it.qty" style="width: 160px" @update:value="v => form.model.bulk[it.id] = v ?? 0")
    span.remain 剩 {{ it.qty }}
  .btn
    NButton(size="large" @click="form.prev") 上一步
    NButton(type="primary" size="large" @click="next") 下一步
</template>

<style lang="stylus" scoped>
.hint
  opacity 0.7
  margin-bottom 1rem
.remain
  margin-left 0.75rem
  opacity 0.7
  white-space nowrap
</style>
