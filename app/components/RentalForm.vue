<script setup>
import { NCard, NSteps, NStep, NSpace, NTag } from "naive-ui"

const form = useFormStore()
const catalog = useCatalogStore()
</script>

<template lang="pug">
.rental
  NCard
    NSteps(:current="form.step + 1" size="small" style="margin-bottom: 1.5rem;")
      NStep(title="借用人")
      NStep(title="時間")
      NStep(title="設備")
      NStep(title="配件")
      NStep(title="簽名")
    BorrowerInfoForm(v-if="form.step === 0")
    DatePickerForm(v-else-if="form.step === 1")
    EquipmentForm(v-else-if="form.step === 2")
    DeviceForm(v-else-if="form.step === 3")
    SignatureForm(v-else)
  .summary
    h4 剩餘數量
    NSpace
      NTag(v-for="s in catalog.summary" :key="s.label" :type="s.remaining ? 'info' : 'error'" :bordered="false") {{ s.label }} {{ s.remaining }}/{{ s.total }}
</template>

<style lang="stylus" scoped>
.rental
  size(560px,auto)
  max-width 100%
  margin 0 auto
  .n-card
    border-radius 1rem
    box-shadow 4px 4px 16px rgba(0,0,0,0.25)
  .summary
    margin-top 1rem
    color #fff
    h4
      margin-bottom 0.5rem
</style>
