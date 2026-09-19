<script setup>
import { NCard, NSteps, NStep, NSpace, NTag } from "naive-ui"

const form = useFormStore()
const catalog = useCatalogStore()
const isMobile = useIsMobile()
const titles = ["借用人", "時間", "設備", "配件", "簽名"]
</script>

<template lang="pug">
.rental
  NCard
    p.step-compact(v-if="isMobile") 步驟 {{ form.step + 1 }} / 5：{{ titles[form.step] }}
    NSteps(v-else :current="form.step + 1" size="small" style="margin-bottom: 1.5rem;")
      NStep(v-for="t in titles" :key="t" :title="t")
    BorrowerInfoForm(v-if="form.step === 0")
    DatePickerForm(v-else-if="form.step === 1")
    EquipmentForm(v-else-if="form.step === 2")
    DeviceForm(v-else-if="form.step === 3")
    SignatureForm(v-else)
  .summary
    h4 剩餘數量
    NSpace(:size="[8, 8]")
      NTag(v-for="s in catalog.summary" :key="s.label" :type="s.remaining ? 'info' : 'error'" :bordered="false" size="medium") {{ s.label }} {{ s.remaining }}/{{ s.total }}
</template>

<style lang="stylus" scoped>
.rental
  size(560px,auto)
  max-width 100%
  margin 0 auto
  .n-card
    border-radius 1rem
    box-shadow 4px 4px 16px rgba(0,0,0,0.25)
  .step-compact
    font-weight 700
    color color_secondary
    margin-bottom 1rem
  .summary
    margin-top 1rem
    color #fff
    h4
      margin-bottom 0.5rem
    .n-tag
      padding 0 12px
</style>
