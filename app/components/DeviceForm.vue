<script setup>
import { NForm, NFormItem, NButton, NInputNumber, useMessage } from "naive-ui"

const message = useMessage()
const form = useFormStore()
const catalog = useCatalogStore()

const next = () => {
  const hasBulk = Object.values(form.model.bulk).some((q) => q > 0)
  if (!form.model.units.length && !hasBulk) return message.error("請至少選一項設備或配件")
  form.next()
}
</script>

<template lang="pug">
NForm(label-placement="left" :label-width="140")
  p.hint(v-if="!catalog.bulkItems.length") 目前沒有可借的配件。
  NFormItem(v-for="it in catalog.bulkItems" :key="it.id" :label="`${it.name}（剩 ${it.qty}）`")
    NInputNumber(:value="form.model.bulk[it.id] ?? 0" :min="0" :max="it.qty" @update:value="v => form.model.bulk[it.id] = v ?? 0")
  .btn
    NButton(@click="form.prev") 上一步
    NButton(type="primary" @click="next") 下一步
</template>

<style lang="stylus" scoped>
.hint
  opacity 0.7
  margin-bottom 1rem
.btn
  flex(flex-end)
  gap 0.5rem
</style>
